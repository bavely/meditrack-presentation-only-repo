import { AI_ASSISTANT_QUERY, DELETE_CONVERSATION, GET_AI_CONVERSATION, GET_AI_CONVERSATIONS } from "../graphql/aiAssistant";
import { apolloClient as client } from '../utils/apollo';


export const getAIConversations = async () => {
    const { data } = await client.query({
        query: GET_AI_CONVERSATIONS,
        fetchPolicy: 'no-cache',
    });
    return data.aiConversations;
}

export const getAIConversation = async (conversationId: string) => {
    const { data } = await client.query({
        query: GET_AI_CONVERSATION,
        variables: { conversationId },
        fetchPolicy: 'no-cache',
    });
    return data.aiConversation;
}

export const askAi = async (prompt: string, conversationId?: string) => {
    const { data } = await client.mutate({
        mutation: AI_ASSISTANT_QUERY,
        variables: { prompt, conversationId },
    });
    return data.getMedicationInfo;
}

export const deleteAIConversation = async (conversationId: string) => {
    const { data } = await client.mutate({
        mutation: DELETE_CONVERSATION,
        variables: { conversationId },
    });
    return data.deleteConversation;
}
