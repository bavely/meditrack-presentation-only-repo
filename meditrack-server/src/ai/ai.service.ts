
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AzureOpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { MedicationPlanDto } from './dto/medication-plan.dto';
import { MedicationPlan } from './models/medication-plan.model';
import { MedicationInstruction } from './models/medication-instruction.model';
import { format, isMatch, isValid, parse } from 'date-fns';
import { RepeatPattern } from '../common/enums/repeat-pattern.enum';
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name); // Add a logger for better debugging
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly apiVersion: string;
  private readonly deployment: string;
  private readonly openai: AzureOpenAI;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.getRequired('AZURE_OPENAI_ENDPOINT');
    this.apiKey = this.getRequired('AZURE_OPENAI_API_KEY');
    this.apiVersion = this.getRequired('AZURE_OPENAI_API_VERSION');
    this.deployment = this.getRequired('AZURE_OPENAI_DEPLOYMENT');

    this.openai = new AzureOpenAI({
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      apiVersion: this.apiVersion,
      deployment: this.deployment,
    });
  }

  private getRequired(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} environment variable is not set`);
    }
    return value;
  }
  async askAi(aiPrompt: string, userPrompt: string): Promise<any> { // Change return type to any, as parsing happens in OcrService
    try {
      this.logger.debug('Calling OpenAI API...');
        const response = await this.openai.chat.completions.create({
          model: 'gpt-5-mini', // Using gpt-5-mini as specified
          messages: [
            {
              role: 'system',
              content: aiPrompt, // System prompt for AI's role and expected output format
            },
            {
              role: 'user',
              content: userPrompt, // User's specific input for parsing
            },
          ],
        });

      this.logger.debug('Received response from OpenAI API');

      // Check if the response structure is as expected
      if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        this.logger.debug(`Raw content from OpenAI: ${content}`);
        this.logger.log('OpenAI API call succeeded');
        // With response_format: "json_object", the content should be parseable JSON
        // The JSON.parse will now be handled more safely in OcrService with try/catch
        return content; // Return raw content string to OcrService for parsing
      } else {
        this.logger.error('OpenAI API returned an unexpected response structure:', response);
        throw new Error('OpenAI API returned an unexpected response structure.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Error calling OpenAI API: ${error.message}`);
        if (error.response) {
          this.logger.error(`OpenAI API response status: ${error.response.status}`);
          this.logger.error(`OpenAI API response data: ${JSON.stringify(error.response.data)}`);
          throw new Error(`OpenAI API error: ${error.response.data.error?.message || 'Unknown error'}`);
        }
      } else {
        this.logger.error(`An unexpected error occurred: ${error.message || error}`);
      }
      throw new Error('Failed to get a valid response from the AI service.');
    }
  }


  public async callAiParser(sanitized: string) {
    const systemPrompt = `
You are a medication parser. Given a scanned label text, extract JSON:
{ name: string, strength: string, quantity?: number,
  instructions?: string, therapy?: string,
Return ONLY valid JSON. No explanation.
`.trim();

    const userPrompt = `Label text:\n"""\n${sanitized}\n"""`;

    this.logger.debug('Sending sanitized text to OpenAI...');
    return this.askAi(systemPrompt, userPrompt);
  }

  // Validate the structured MedicationInstruction object
  public validateMedicationInstruction(data: any): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data || typeof data !== 'object') {
      errors.push({ field: 'data_structure', message: 'Invalid instruction structure returned by AI' });
      return errors;
    }

    if (!data.medicationName || typeof data.medicationName !== 'string') {
      errors.push({ field: 'medicationName', message: 'medicationName is required' });
    }
    if (!data.action || typeof data.action !== 'string') {
      errors.push({ field: 'action', message: 'action is required' });
    }
    if (
      data.doseQuantity === undefined ||
      data.doseQuantity === null ||
      Number.isNaN(Number(data.doseQuantity))
    ) {
      errors.push({ field: 'doseQuantity', message: 'doseQuantity must be a number' });
    }
    if (!data.doseUnit || typeof data.doseUnit !== 'string') {
      errors.push({ field: 'doseUnit', message: 'doseUnit is required' });
    }
    if (!data.route || typeof data.route !== 'string') {
      errors.push({ field: 'route', message: 'route is required' });
    }

    if (!data.timing || typeof data.timing !== 'object') {
      errors.push({ field: 'timing', message: 'timing object is required' });
    } else {
      const t = data.timing;
      const allowedUnits = ['s', 'min', 'h', 'd', 'wk', 'mo', 'a', null, undefined];
      if (t.periodUnit && !allowedUnits.includes(t.periodUnit)) {
        errors.push({ field: 'timing.periodUnit', message: 'periodUnit must be one of s|min|h|d|wk|mo|a' });
      }
      if (t.offset && (!Number.isInteger(t.offset) || t.offset < 0)) {
        errors.push({ field: 'timing.offset', message: 'offset must be a non-negative integer (minutes)' });
      }
      if (t.bounds && typeof t.bounds === 'object') {
        const b = t.bounds;
        if (b.start && isNaN(Date.parse(b.start))) {
          errors.push({ field: 'timing.bounds.start', message: 'start must be a valid ISO 8601 string' });
        }
        if (b.end && isNaN(Date.parse(b.end))) {
          errors.push({ field: 'timing.bounds.end', message: 'end must be a valid ISO 8601 string' });
        }
        if (b.count && (!Number.isInteger(b.count) || b.count < 1)) {
          errors.push({ field: 'timing.bounds.count', message: 'count must be a positive integer' });
        }
      }
    }

    if (!data.asNeeded || typeof data.asNeeded !== 'object') {
      errors.push({ field: 'asNeeded', message: 'asNeeded is required' });
    } else if (typeof data.asNeeded.boolean !== 'boolean') {
      errors.push({ field: 'asNeeded.boolean', message: 'asNeeded.boolean must be true or false' });
    }

    // Optional fields validations
    if (data.maxDosePerPeriod && typeof data.maxDosePerPeriod === 'object') {
      const m = data.maxDosePerPeriod;
      if (m.numerator != null && Number.isNaN(Number(m.numerator))) {
        errors.push({ field: 'maxDosePerPeriod.numerator', message: 'numerator must be a number' });
      }
      if (m.denominator && typeof m.denominator === 'object') {
        if (m.denominator.value != null && Number.isNaN(Number(m.denominator.value))) {
          errors.push({ field: 'maxDosePerPeriod.denominator.value', message: 'denominator.value must be a number' });
        }
        if (m.denominator.unit != null && typeof m.denominator.unit !== 'string') {
          errors.push({ field: 'maxDosePerPeriod.denominator.unit', message: 'denominator.unit must be a string' });
        }
      }
    }

      return errors;
    }

  public async structureMedicationInstruction(
    instructionText: string,
    medicationName?: string,
  ): Promise<MedicationInstruction> {
    const systemPrompt = `You are a medication instruction parser. Convert directions (Sig) into a structured JSON object compatible with FHIR Dosage/Timing and UMS guidelines.
Return ONLY JSON with this exact shape:
{
  "medicationName": string,
  "action": string,               // e.g., "take", "apply", "inject", "inhale"
  "doseQuantity": number,         // numeric dose
  "doseUnit": string,             // e.g., tablet, capsule, mL
  "route": string,                // e.g., oral, intramuscular, topical
  "timing": {
    "frequency": number|null,
    "frequencyMax": number|null,
    "period": number|null,
    "periodMax": number|null,
    "periodUnit": string|null,    // one of: "s","min","h","d","wk","mo","a"
    "timeOfDay": string[]|null,   // e.g., ["morning","bedtime"] or explicit times like ["08:00"]
    "dayOfWeek": string[]|null,   // e.g., ["mon","thu"]
    "when": string[]|null,        // event codes, e.g., ["AC"(before meals),"HS"(at bedtime)]
    "offset": number|null,        // minutes offset
    "bounds": {
      "start": string|null,       // ISO 8601
      "end": string|null,         // ISO 8601
      "count": number|null        // total number of doses if bounded by count
    }
  },
  "asNeeded": {"boolean": boolean, "reason": string|null},
  "maxDosePerPeriod": {"numerator": number|null, "denominator": {"value": number|null, "unit": string|null}} ,
  "patientInstruction": string|null,
  "indication": string|null
}

Rules:
- Map common frequencies: QD=1x/day; BID=2x/day; TID=3x/day; QID=4x/day.
- "every N hours" => frequency=1, period=N, periodUnit="h".
- "every N days/weeks/months" => frequency=1, period=N, periodUnit="d"/"wk"/"mo".
- Ranges like "2-4 times daily" => frequency=2, frequencyMax=4, period=1, periodUnit="d".
- UMS timeOfDay: morning, noon, evening, bedtime. Use when label implies these.
- Event-based: use when (e.g., AC=before meals, PC=after meals, HS=bedtime) and offset in minutes (e.g., 60 for 1 hour).
- For PRN/as needed, set asNeeded.boolean=true and include reason if present.
- Use timing.bounds.start/end/count if the instruction specifies duration (e.g., "for 10 days") or total doses.
- times must be 24h "HH:mm" when explicit times are given.
- Keep patientInstruction with friendly phrasing like food instructions.
- If data is missing, set fields to null appropriately; do not invent facts.
`;

    const userPrompt = `Instruction:\n"""\n${instructionText}\n"""\nMedication name: ${medicationName ?? ''}`;

    const content = await this.askAi(systemPrompt, userPrompt);
    let parsed: MedicationInstruction;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      this.logger.error('Failed to parse AI structured instruction JSON', e as any);
      throw new Error('AI returned invalid JSON for structured instruction');
    }

    // Basic normalization: ensure strings for name/action/route
    parsed.medicationName = (parsed.medicationName ?? medicationName ?? '').toString();
    if (!parsed.action) parsed.action = 'take';
    if (!parsed.route) parsed.route = 'oral';
    if (!parsed.asNeeded) parsed.asNeeded = { boolean: false, reason: null } as any;
    if (!parsed.timing) parsed.timing = {} as any;
    if (!parsed.timing.bounds) parsed.timing.bounds = { start: null, end: null, count: null } as any;

    const errors = this.validateMedicationInstruction(parsed);
    if (errors.length) {
      this.logger.error('AI returned invalid structured instruction', errors);
      throw new Error('AI returned invalid structured instruction');
    }

    return parsed;
  }

  private extractRepeatInfo(instr: string): { repeatPattern: RepeatPattern; interval: number } | null {
    const match = /every\s+(\d+)?\s*(day|week|month)/i.exec(instr);
    if (!match) return null;
    const interval = match[1] ? parseInt(match[1], 10) : 1;
    const unit = match[2].toLowerCase();
    let repeatPattern: RepeatPattern;
    switch (unit) {
      case 'week':
        repeatPattern = RepeatPattern.WEEKLY;
        break;
      case 'month':
        repeatPattern = RepeatPattern.MONTHLY;
        break;
      default:
        repeatPattern = RepeatPattern.DAILY;
        break;
    }
    return { repeatPattern, interval };
  }

  public validateMedicationData(data: any): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    // Check if data is an object
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'data_structure',
        message: 'Invalid medication data structure returned by AI',
      });
      return errors;
    }

    // Validate required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Medication name is required',
      });
    }

    // Attempt to derive schedule from instructions if not provided
    if (!data.schedule && data.instructions) {
      const rep = this.extractRepeatInfo(data.instructions);
      if (rep) {
        data.schedule = { repeatPattern: rep.repeatPattern, interval: rep.interval, times: [] };
      }
    }

    // Validate schedule if present
    if (data.schedule) {
      const schedule = data.schedule;
      if (!schedule.repeatPattern) {
        errors.push({ field: 'schedule.repeatPattern', message: 'repeatPattern is required' });
      } else {
        // Normalize repeat pattern strings to enum values  
        const normalizedPattern = schedule.repeatPattern.toString().toUpperCase();
        if (!Object.values(RepeatPattern).includes(normalizedPattern as RepeatPattern)) {
          errors.push({ field: 'schedule.repeatPattern', message: 'Invalid repeatPattern value' });
        }
      }

      if (schedule.interval && (!Number.isInteger(schedule.interval) || schedule.interval <= 0)) {
        errors.push({ field: 'schedule.interval', message: 'interval must be a positive integer' });
      }

      if (schedule.doseDates) {
        if (!Array.isArray(schedule.doseDates) || schedule.doseDates.length === 0) {
          errors.push({ field: 'schedule.doseDates', message: 'doseDates must be a non-empty array' });
        } else {
          for (const d of schedule.doseDates) {
            if (typeof d !== 'string' || isNaN(Date.parse(d))) {
              errors.push({ field: 'schedule.doseDates', message: 'Each doseDate must be an ISO string' });
              break;
            }
          }
        }
      }

      if (schedule.times) {
        if (!Array.isArray(schedule.times) || schedule.times.length === 0) {
          errors.push({ field: 'schedule.times', message: 'Schedule times cannot be empty' });
        } else {
          for (const time of schedule.times as any[]) {
            if (typeof time === 'string') {
              if (!/^\d{2}:\d{2}$/.test(time)) {
                errors.push({ field: 'schedule.times', message: 'Each time must be in HH:mm format' });
                break;
              }
            } else if (time && typeof time === 'object') {
              if (typeof time.time !== 'string' || !/^\d{2}:\d{2}$/.test(time.time)) {
                errors.push({ field: 'schedule.times.time', message: 'time must be in HH:mm format' });
                break;
              }
              if (time.dosageQty != null && (!Number.isInteger(time.dosageQty) || time.dosageQty <= 0)) {
                errors.push({ field: 'schedule.times.dosageQty', message: 'dosageQty must be a positive integer' });
                break;
              }
              if (time.dosageUnit != null && typeof time.dosageUnit !== 'string') {
                errors.push({ field: 'schedule.times.dosageUnit', message: 'dosageUnit must be a string' });
                break;
              }
            } else {
              errors.push({ field: 'schedule.times', message: 'Invalid time entry' });
              break;
            }
          }
        }
      }
    }

    // Validate dosage format if present
    if (data.strength && typeof data.strength !== 'string') {
      errors.push({
        field: 'strength',
        message: 'Strength must be a string',
      });
    }

    // Validate quantity if present
    if (data.quantity && (!Number.isInteger(data.quantity) || data.quantity <= 0)) {
      errors.push({
        field: 'quantity',
        message: 'Quantity must be a positive integer',
      });
    }

      return errors;
    }

  public validateMedicationPlan(data: any): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data || typeof data !== 'object') {
      errors.push({ field: 'data_structure', message: 'Invalid plan data structure returned by AI' });
      return errors;
    }

    if (!data.medication || typeof data.medication !== 'object') {
      errors.push({ field: 'medication', message: 'Medication data is required' });
    } else {
      errors.push(
        ...this.validateMedicationData({
          ...data.medication,
          schedule: data.schedule,
        }).map((e) => ({
          field: `medication.${e.field}`,
          message: e.message,
        })),
      );
    }

    if (!data.schedule || typeof data.schedule !== 'object') {
      errors.push({ field: 'schedule', message: 'Schedule data is required' });
    } else {
      const schedule = data.schedule;
      if (!Number.isInteger(schedule.totalCount) || schedule.totalCount <= 0) {
        errors.push({ field: 'schedule.totalCount', message: 'totalCount must be a positive integer' });
      }

      if (!schedule.repeatPattern) {
        errors.push({ field: 'schedule.repeatPattern', message: 'repeatPattern is required' });
      } else {
        // Normalize repeat pattern strings to enum values
        const normalizedPattern = schedule.repeatPattern.toString().toUpperCase();
        if (!Object.values(RepeatPattern).includes(normalizedPattern as RepeatPattern)) {
          errors.push({ field: 'schedule.repeatPattern', message: 'Invalid repeatPattern value' });
        }
      }

      if (schedule.interval && (!Number.isInteger(schedule.interval) || schedule.interval <= 0)) {
        errors.push({ field: 'schedule.interval', message: 'interval must be a positive integer' });
      }

      if (
        !schedule.firstTime ||
        typeof schedule.firstTime !== 'string' ||
        isNaN(Date.parse(schedule.firstTime))
      ) {
        errors.push({ field: 'schedule.firstTime', message: 'firstTime must be a valid ISO 8601 string' });
      }

      if (
        !schedule.lastTime ||
        typeof schedule.lastTime !== 'string' ||
        isNaN(Date.parse(schedule.lastTime))
      ) {
        errors.push({ field: 'schedule.lastTime', message: 'lastTime must be a valid ISO 8601 string' });
      }

      if (schedule.doseDates) {
        if (!Array.isArray(schedule.doseDates) || schedule.doseDates.length === 0) {
          errors.push({ field: 'schedule.doseDates', message: 'doseDates must be a non-empty array' });
        } else {
          for (const d of schedule.doseDates) {
            if (typeof d !== 'string' || isNaN(Date.parse(d))) {
              errors.push({ field: 'schedule.doseDates', message: 'Each doseDate must be an ISO string' });
              break;
            }
          }
        }
      }

      if (!schedule.doseDates) {
        if (!Array.isArray(schedule.times) || schedule.times.length === 0) {
          if (!Number.isInteger(schedule.frequency) || !schedule.intervalUnit) {
            errors.push({
              field: 'schedule.times',
              message: 'times must be provided or frequency/intervalUnit specified',
            });
          }
        } else {
          for (const time of schedule.times as any[]) {
            if (typeof time === 'string') {
              if (!/^\d{2}:\d{2}$/.test(time)) {
                errors.push({ field: 'schedule.times', message: 'Each time must be in HH:mm format' });
                break;
              }
            } else if (time && typeof time === 'object') {
              if (typeof time.time !== 'string' || !/^\d{2}:\d{2}$/.test(time.time)) {
                errors.push({ field: 'schedule.times.time', message: 'time must be in HH:mm format' });
                break;
              }
              if (!Number.isInteger(time.dosageQty) || time.dosageQty <= 0) {
                errors.push({ field: 'schedule.times.dosageQty', message: 'dosageQty must be a positive integer' });
                break;
              }
              if (!time.dosageUnit || typeof time.dosageUnit !== 'string') {
                errors.push({ field: 'schedule.times.dosageUnit', message: 'dosageUnit is required' });
                break;
              }
            } else {
              errors.push({ field: 'schedule.times', message: 'Invalid time entry' });
              break;
            }
          }
        }
      }

      if (
        Number.isInteger(schedule.totalCount) &&
        schedule.totalCount > 0 &&
        schedule.firstTime &&
        typeof schedule.firstTime === 'string' &&
        !isNaN(Date.parse(schedule.firstTime)) &&
        schedule.lastTime &&
        typeof schedule.lastTime === 'string' &&
        !isNaN(Date.parse(schedule.lastTime)) &&
        ((Array.isArray(schedule.times) && schedule.times.length > 0) ||
          (Array.isArray(schedule.doseDates) && schedule.doseDates.length > 0) ||
          (Number.isInteger(schedule.frequency) && schedule.intervalUnit))
      ) {
        const firstDate = new Date(schedule.firstTime);
        const lastDate = new Date(schedule.lastTime);
        const now = new Date();

        if (lastDate < firstDate) {
          errors.push({
            field: 'schedule.lastTime',
            message: 'lastTime must be later than or equal to firstTime',
          });
        } else {
          // allow future lastTime by clamping to current date for validation
          // Use a consistent "now" timestamp to avoid race conditions
          const validationTime = new Date();
          const actualLast = lastDate > validationTime ? validationTime : lastDate;

          let dosesTaken = 0;
          if (Array.isArray(schedule.doseDates) && schedule.doseDates.length > 0) {
            // Only count doses that are explicitly in the past
            for (const d of schedule.doseDates) {
              const dt = new Date(d);
              if (dt >= firstDate && dt < validationTime) {
                dosesTaken++;
              }
            }
          } else if (Array.isArray(schedule.times) && schedule.times.length > 0) {
            const interval = Number.isInteger(schedule.interval) && schedule.interval > 0 ? schedule.interval : 1;
            const rp = (schedule.repeatPattern || 'DAILY').toString().toUpperCase();
            let step = 1;
            if (rp === 'WEEKLY') step = 7 * interval;
            else if (rp === 'MONTHLY') step = 30 * interval;
            else step = 1 * interval;

            const timesArr: any[] = Array.isArray(schedule.times) ? (schedule.times as any[]) : [];
            
            // Only count doses that are in the past for validation purposes
            for (
              let day = new Date(firstDate);
              day < validationTime && (actualLast >= validationTime ? true : day <= actualLast);
              day.setDate(day.getDate() + step)
            ) {
              // Add all doses for each dosing day that's in the past
              for (const t of timesArr) {
                const timeStr = typeof t === 'string' ? t : t.time;
                if (!timeStr || typeof timeStr !== 'string') continue;
                
                const [hour, minute] = timeStr.split(':').map(Number);
                if (isNaN(hour) || isNaN(minute)) continue;
                
                const doseTime = new Date(day);
                doseTime.setHours(hour, minute, 0, 0);
                
                // Only count if dose time is in the past
                if (doseTime >= firstDate && doseTime < validationTime) {
                  const inc = typeof t === 'string' ? 1 : (t.dosageQty ?? 1);
                  dosesTaken += inc;
                }
              }
            }
          } else if (schedule.frequency && schedule.intervalUnit) {
            // Simplified calculation for frequency-based schedules
            const interval = Number.isInteger(schedule.interval) && schedule.interval > 0 ? schedule.interval : 1;
            let step = 1;
            if (schedule.intervalUnit === 'wk') step = 7 * interval;
            else if (schedule.intervalUnit === 'mo') step = 30 * interval;
            else if (schedule.intervalUnit === 'd') step = interval;
            else step = 1;

            const perDay = schedule.frequency || 1;
            
            // Calculate days elapsed only up to validation time
            const endTime = actualLast >= validationTime ? validationTime : actualLast;
            const diffMs = endTime.getTime() - firstDate.getTime();
            const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            const doseDaysTaken = Math.floor(diffDays / step);
            
            dosesTaken = doseDaysTaken * perDay;
          }

          if (schedule.totalCount < dosesTaken) {
            errors.push({
              field: 'schedule.totalCount',
              message: `totalCount must be at least ${dosesTaken} to cover doses already taken`,
            });
          }

          const remaining = schedule.totalCount - dosesTaken;
          if (remaining <= 0) {
            errors.push({
              field: 'schedule.totalCount',
              message: 'totalCount leaves no remaining doses',
            });
          }
        }
      }
    }

    if (data.maxDosePerInterval && typeof data.maxDosePerInterval === 'object') {
      const m = data.maxDosePerInterval;
      if (m.numerator != null && Number.isNaN(Number(m.numerator))) {
        errors.push({ field: 'maxDosePerInterval.numerator', message: 'numerator must be a number' });
      }
      if (m.denominator && typeof m.denominator === 'object') {
        if (m.denominator.value != null && Number.isNaN(Number(m.denominator.value))) {
          errors.push({ field: 'maxDosePerInterval.denominator.value', message: 'denominator.value must be a number' });
        }
        if (m.denominator.unit != null && typeof m.denominator.unit !== 'string') {
          errors.push({ field: 'maxDosePerInterval.denominator.unit', message: 'denominator.unit must be a string' });
        }
      }
    }

    return errors;
  }

  public async toHHmm(t: string | number | Date): Promise<string> {
    // normalize to string when possible
    const s = typeof t === "string" ? t.trim() : String(t);

    // Handle simple H:mm or HH:mm format by padding - do this first
    if (typeof t === "string" && /^\d{1,2}:\d{2}$/.test(s)) {
      const [hours, minutes] = s.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }

    // already in 24h HH:mm? keep it, but ensure padding
    if (typeof t === "string" && isMatch(s, "HH:mm")) return s;

    // try a few common shapes, then fall back to Date(...)
    const candidates = [
      () => parse(s, "h:mm a", new Date()),     // e.g. "9:05 pm"
      () => parse(s, "hh:mm a", new Date()),    // e.g. "09:05 PM"
      () => parse(s, "HH:mm:ss", new Date()),   // e.g. "21:05:00"
      () => parse(s, "HHmm", new Date()),       // e.g. "2105"
      () => parse(s, "Hmm", new Date()),        // e.g. "905"
      () => new Date(s),                        // ISO strings, timestamps, etc.
    ];

    let dt: Date | null = null;
    for (const make of candidates) {
      try {
        const d = make();
        if (isValid(d)) { 
          dt = d; 
          break; 
        }
      } catch (e) {
        // Continue trying other formats
        continue;
      }
    }

    if (!dt) {
      this.logger.warn(`Could not parse time: ${t}`);
      return s;
    }
    
    this.logger.debug(`Formatted time: ${format(dt, "HH:mm")} =================>`);
    return format(dt, "HH:mm");
  };



  public async analyzeMedicationPlan(input: MedicationPlanDto): Promise<MedicationPlan> {
    const systemPrompt =
`You are a medication instruction parser and planner. Parse free-text directions (Sig) into a JSON object compatible with FHIR Dosage/Timing and UMS. Return ONLY JSON with the exact shape provided below (no comments). Use UTC for all computations. You are given nowUtc: any (ISO Z).

Schema (keys only; values are placeholders):
{
  "medication": {
    "name": "",
    "doseQuantity": null,
    "doseUnit": "",
    "route": "",
    "instructions": "",
    "therapy": ""
  },
  "schedule": {
    "quantityLeft": null,
    "totalCount": null,
    "frequency": null,
    "frequencyMax": null,
    "interval": null,
    "intervalMax": null,
    "intervalUnit": null,      // one of: "s","min","h","d","wk","mo","a"
    "timeOfDay": null,       // e.g. ["morning","bedtime"] or ["08:00"]
    "dayOfWeek": null,       // e.g. ["mon","thu"]
    "when": null,            // e.g. ["AC","PC","HS"]
    "offset": null,          // minutes
    "times": null,           // array of {"time":"HH:mm","dosageQty":number,"dosageUnit":string} OR null
    "doseDates": null,       // array of "YYYY-MM-DD" OR null
    "bounds": {
      "firstTime": "",
      "lastTime": "",
      "count": null
    }
  },
  "asNeeded": {"boolean": false, "reason": null},
  "maxDosePerInterval": {"numerator": null, "denominator": {"value": null, "unit": null}},
  "patientInstruction": null,
  "indication": null
}

Rules:
1) Interpret cadence from frequency/interval/intervalUnit.
   - Map: QD=1/d, BID=2/d, TID=3/d, QID=4/d; q6h/q8h/q12h => 1 per 6/8/12 h; qod => 1 per 2 d.
   - "every N hours/days/weeks/months" => frequency=1, interval=N, intervalUnit accordingly.
   - Ranges: "2-4 times daily" => frequency=2, frequencyMax=4, interval=1, intervalUnit="d".
2) Anchoring: Use schedule.bounds.lastTime if present; else firstTime; else nowUtc.
3) Exactly one way to specify the plan:
   a) Non-daily (wk, mo, a): set doseDates (list of dates) AND set times to a SINGLE time; set dayOfWeek=null.
   b) Daily (d): set times (one or more per day) and leave doseDates=null.
   c) If neither weekdays nor explicit times known, evenly space doses; then follow (a) or (b) based on intervalUnit.
   Never output both doseDates and dayOfWeek together. Never set times.length>1 unless intervalUnit="d".
4) Weekly specifics: if intervalUnit="wk" and frequency=K and dayOfWeek is missing, derive K weekdays by distributing from the anchor (e.g., K=2 → anchor weekday and +3 or +4 days). Use ONE time per selected day.
5) Monthly specifics: if instruction names a calendar day, keep that day; if it names an ordinal weekday (e.g., first Monday), reflect that in dayOfWeek plus implicit ordinal; otherwise inherit anchor’s day-of-month.
6) PRN: set asNeeded.boolean=true and keep reason. Do not generate schedule times/dates unless a max schedule is present. If a max daily allowance exists, enforce it in maxDosePerInterval and include frequency and intervalUnit (e.g., frequency=2, intervalUnit="d").
7) Quantity math: generate the full plan, count doses ≤ nowUtc to compute quantityLeft = max(totalCount - taken*doseQuantity, 0). If totalCount absent, leave quantityLeft as given or null.
8) Conflicts: if rules would conflict, prefer non-daily pattern (doseDates + single time) over mixing times/dayOfWeek/dates. Do not create cross-products of doseDates × times.
9) Output ONLY JSON. No comments. Use 24h "HH:mm", "YYYY-MM-DD", and ISO 8601 Z for bounds times.
Inputs available: nowUtc = "<ISO Z>", plus the user-provided JSON.
Note: Now is  ${new Date().toISOString()} in ISO 8601 Z format.
`;
    const userPrompt = JSON.stringify(input);
    const result = await this.askAi(systemPrompt, userPrompt);

    let parsed: MedicationPlan;
    try {
      parsed = JSON.parse(result);
      this.logger.debug('Parsed medication plan from AI', parsed);

      if ((parsed as any).maxDosePerinterval && !(parsed as any).maxDosePerInterval) {
        (parsed as any).maxDosePerInterval = (parsed as any).maxDosePerinterval;
        delete (parsed as any).maxDosePerinterval;
      }

      // If AI returned bounds only, promote them to top-level fields
      if (
        parsed.schedule &&
        typeof parsed.schedule === 'object' &&
        (parsed.schedule as any).bounds
      ) {
        const b: any = (parsed.schedule as any).bounds;
        if (!parsed.schedule.firstTime && b.firstTime) {
          parsed.schedule.firstTime = b.firstTime;
        }
        if (!parsed.schedule.lastTime && b.lastTime) {
          parsed.schedule.lastTime = b.lastTime;
        }
        if (parsed.schedule.totalCount == null && b.count != null) {
          parsed.schedule.totalCount = b.count;
        }
        delete (parsed.schedule as any).bounds;
      }

      // Normalize medication fields to ensure downstream compatibility
      if (parsed.medication && typeof parsed.medication === 'object') {
        const med: any = parsed.medication as any;
        // Ensure name is string
        if (med.name != null) med.name = String(med.name);
        if (med.doseQuantity != null)
          med.doseQuantity = Number(med.doseQuantity);
        if (med.doseUnit != null) med.doseUnit = String(med.doseUnit);
        if (med.route != null) med.route = String(med.route);
        // Coerce dosage from doseQuantity + doseUnit when needed
        if (!med.strength) {
          const dq = med.doseQuantity;
          const du = med.doseUnit;
          if (dq != null && du) {
            med.strength = `${dq} ${du}`;
          } else if (input.strength) {
            med.strength = input.strength;
          }
        }
        // Default quantity when missing to the reported totalCount
        if (med.quantity == null && parsed.schedule?.totalCount != null) {
          med.quantity = parsed.schedule.totalCount;
        }
      }
      if (parsed.schedule) {
        const sch: any = parsed.schedule as any;
        if (sch.frequency != null) sch.frequency = Number(sch.frequency);
        if (sch.frequencyMax != null) sch.frequencyMax = Number(sch.frequencyMax);
        if (sch.intervalMax != null) sch.intervalMax = Number(sch.intervalMax);
        if (sch.intervalUnit != null) sch.intervalUnit = String(sch.intervalUnit);
        if (sch.timeOfDay)
          sch.timeOfDay = Array.isArray(sch.timeOfDay)
            ? sch.timeOfDay.map((t: any) => String(t))
            : [String(sch.timeOfDay)];
        if (sch.dayOfWeek)
          sch.dayOfWeek = Array.isArray(sch.dayOfWeek)
            ? sch.dayOfWeek.map((d: any) => String(d))
            : [String(sch.dayOfWeek)];
        if (sch.when)
          sch.when = Array.isArray(sch.when)
            ? sch.when.map((w: any) => String(w))
            : [String(sch.when)];
        if (sch.offset != null) sch.offset = Number(sch.offset);
        if (sch.quantityLeft != null) sch.quantityLeft = Number(sch.quantityLeft);

        const rawRp = sch.repeatPattern?.toString();
        const rp = rawRp?.toUpperCase();
        if (rp && Object.values(RepeatPattern).includes(rp as RepeatPattern)) {
          sch.repeatPattern = rp as RepeatPattern;
        } else if (rawRp) {
          const rep = this.extractRepeatInfo(rawRp);
          if (rep) {
            sch.repeatPattern = rep.repeatPattern;
            sch.interval = rep.interval;
          } else {
            sch.repeatPattern = RepeatPattern.DAILY;
          }
        } else {
          sch.repeatPattern = RepeatPattern.DAILY;
        }
      }
      if (parsed.schedule.times) {
        const normalized: any[] = [];
        for (const t of parsed.schedule.times as any[]) {
          if (typeof t === 'string') {
            normalized.push({
              time: await this.toHHmm(t),
              dosageQty: 1,
              dosageUnit: 'unit',
            });
          } else if (t && typeof t === 'object') {
            normalized.push({
              time: await this.toHHmm(t.time ?? t),
              dosageQty: Number.isFinite(Number(t.dosageQty)) ? Number(t.dosageQty) : 1,
              dosageUnit: (t.dosageUnit ?? 'unit').toString(),
            });
          }
        }
        (parsed.schedule as any).times = normalized;
      }

      if (parsed.maxDosePerInterval && typeof parsed.maxDosePerInterval === 'object') {
        const mdi: any = parsed.maxDosePerInterval;
        if (mdi.numerator != null) mdi.numerator = Number(mdi.numerator);
        if (mdi.denominator && typeof mdi.denominator === 'object') {
          if (mdi.denominator.value != null) mdi.denominator.value = Number(mdi.denominator.value);
          if (mdi.denominator.unit != null) mdi.denominator.unit = String(mdi.denominator.unit);
        }
      }

    if (parsed.schedule) {
      if (
        !parsed.schedule.firstTime ||
        isNaN(Date.parse(parsed.schedule.firstTime))
      ) {
        parsed.schedule.firstTime =
          (input.firstTime as any) instanceof Date
            ? (input.firstTime as any).toISOString()
            : input.firstTime;
      }
      if (
        !parsed.schedule.lastTime ||
        isNaN(Date.parse(parsed.schedule.lastTime))
      ) {
        parsed.schedule.lastTime =
          (input.lastTime as any) instanceof Date
            ? (input.lastTime as any).toISOString()
            : input.lastTime;
      }
      this.logger.debug(
        `Normalized schedule times: firstTime=${parsed.schedule.firstTime}, lastTime=${parsed.schedule.lastTime}`,
      );
    }

    if (
      parsed.medication?.instructions &&
      (!parsed.schedule.repeatPattern || !parsed.schedule.interval)
    ) {
      const rep = this.extractRepeatInfo(parsed.medication.instructions);
      if (rep) {
        parsed.schedule.repeatPattern = parsed.schedule.repeatPattern || rep.repeatPattern;
        parsed.schedule.interval = parsed.schedule.interval || rep.interval;
      }
    }
    } catch (e) {
      this.logger.error('Failed to parse AI medication plan', e);
      throw new Error('Invalid response from AI when analyzing medication plan');
    }

    const validationErrors = this.validateMedicationPlan(parsed);
    if (validationErrors.length > 0) {
      this.logger.error('AI returned invalid medication plan', validationErrors);
      throw new Error('AI returned invalid medication plan');
    }

    return parsed;
  }
}

