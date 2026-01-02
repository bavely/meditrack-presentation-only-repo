import { Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { borderRadius, spacing } from '../../constants/Theme';
import {
  askAi,
  deleteAIConversation,
  getAIConversation,
  getAIConversations,
} from '../../services/aiAssistantService';

const MENU_WIDTH_RATIO = 0.75;

type ApiMessage = {
  id?: string | number | null;
  role?: string | null;
  content?: string | null;
  timestamp?: string | null;
};

type ApiConversation = {
  conversationId?: string | null;
  title?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  messages?: ApiMessage[] | null;
};

type ConversationPreview = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
};

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
};

const parseDate = (value?: string | null) => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const AssistantScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const [menuWidth, setMenuWidth] = useState(() => windowWidth * MENU_WIDTH_RATIO);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletionNotice, setDeletionNotice] = useState<string | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  const slideAnim = useRef(new Animated.Value(-menuWidth)).current;
  const previousMenuWidth = useRef(menuWidth);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
  const styles = createStyles(colorScheme);
  const palette = Colors[colorScheme];
  const pendingDeleteConversation = useMemo(() => {
    if (!pendingDeleteId) {
      return null;
    }

    return (
      conversations.find(conversation => conversation.id === pendingDeleteId) ?? null
    );
  }, [conversations, pendingDeleteId]);

  useEffect(() => {
    const nextMenuWidth = windowWidth * MENU_WIDTH_RATIO;
    setMenuWidth(prevWidth =>
      prevWidth === nextMenuWidth ? prevWidth : nextMenuWidth,
    );
  }, [windowWidth]);

  useEffect(() => {
    if (previousMenuWidth.current === menuWidth) {
      return;
    }

    slideAnim.setValue(isMenuOpen ? 0 : -menuWidth);
    previousMenuWidth.current = menuWidth;
  }, [isMenuOpen, menuWidth, slideAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isMenuOpen ? 0 : -menuWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isMenuOpen ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isMenuOpen, menuWidth, overlayOpacity, slideAnim]);

  useEffect(() => {
    if (!deletionNotice) {
      return;
    }

    const timeout = setTimeout(() => {
      setDeletionNotice(null);
    }, 4000);

    return () => {
      clearTimeout(timeout);
    };
  }, [deletionNotice]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const buildMessages = useCallback((conversationData?: ApiConversation | null) => {
    if (!conversationData?.messages?.length) {
      return [];
    }

    const fallbackTimestamp = parseDate(
      conversationData.updatedAt ?? conversationData.createdAt,
    );

    const mapped = conversationData.messages.map((message, index) => {
      const messageTimestamp = message.timestamp
        ? parseDate(message.timestamp)
        : fallbackTimestamp;

      return {
        id:
          message.id !== undefined && message.id !== null
            ? String(message.id)
            : `${conversationData.conversationId ?? 'message'}-${index}`,
        text: message.content ?? '',
        isBot: message.role !== 'user',
        timestamp: messageTimestamp,
      };
    });

    mapped.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return mapped;
  }, []);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      setIsLoadingMessages(true);
      setError(null);

      try {
        const response = await getAIConversation(conversationId);
        if (!response?.success) {
          const [firstError] = response?.errors ?? [];
          throw new Error(firstError?.message ?? 'Failed to load conversation');
        }

        const conversationData: ApiConversation | undefined = response.data;
        if (!conversationData) {
          throw new Error('Conversation not found');
        }

        const conversationMessages = buildMessages(conversationData);
        const resolvedConversationId =
          conversationData.conversationId ?? conversationId;

        setMessages(conversationMessages);
        setActiveConversationId(resolvedConversationId);

        const lastMessage =
          conversationMessages[conversationMessages.length - 1];
        const updatedTimestamp = conversationData.updatedAt
          ? parseDate(conversationData.updatedAt)
          : lastMessage?.timestamp ?? parseDate(conversationData.createdAt);

        setConversations(prev => {
          const existing = prev.find(conv => conv.id === resolvedConversationId);
          const preview: ConversationPreview = {
            id: resolvedConversationId,
            title:
              conversationData.title ?? existing?.title ?? 'New Conversation',
            lastMessage: lastMessage?.text ?? existing?.lastMessage ?? '',
            timestamp: updatedTimestamp,
          };

          const filtered = prev.filter(
            conv => conv.id !== resolvedConversationId,
          );
          const next = [...filtered, preview];
          next.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          return next;
        });

        scrollToBottom();
        closeMenu();
      } catch (conversationError) {
        setError(
          conversationError instanceof Error
            ? conversationError.message
            : 'Failed to load conversation',
        );
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [buildMessages, closeMenu, scrollToBottom],
  );

  const sendMessage = useCallback(async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSending) {
      return;
    }

    const provisionalMessage: Message = {
      id: `temp-${Date.now()}`,
      text: trimmedText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, provisionalMessage]);
    setInputText('');
    setError(null);
    setIsSending(true);

    try {
      const response = await askAi(
        trimmedText,
        activeConversationId ?? undefined,
      );

      if (!response?.success) {
        const [firstError] = response?.errors ?? [];
        throw new Error(firstError?.message ?? 'Failed to send message');
      }

      const conversationData: ApiConversation | undefined = response.data;
      if (!conversationData) {
        throw new Error('No conversation data returned from assistant');
      }

      const resolvedConversationId =
        conversationData.conversationId ?? provisionalMessage.id;
      const updatedMessages = buildMessages(conversationData);
      setMessages(updatedMessages);
      setActiveConversationId(resolvedConversationId);

      const lastMessage = updatedMessages[updatedMessages.length - 1];
      const updatedTimestamp = conversationData.updatedAt
        ? parseDate(conversationData.updatedAt)
        : lastMessage?.timestamp ?? parseDate(conversationData.createdAt);

      const preview: ConversationPreview = {
        id: resolvedConversationId,
        title: conversationData.title ?? 'New Conversation',
        lastMessage: lastMessage?.text ?? '',
        timestamp: updatedTimestamp,
      };

      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== resolvedConversationId);
        const next = [...filtered, preview];
        next.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return next;
      });
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : 'Failed to send message',
      );
      setMessages(prev =>
        prev.filter(message => message.id !== provisionalMessage.id),
      );
      setInputText(trimmedText);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  }, [activeConversationId, buildMessages, inputText, isSending, scrollToBottom]);

  useEffect(() => {
    let isActive = true;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setError(null);

      try {
        const response = await getAIConversations();
        if (!response?.success) {
          const [firstError] = response?.errors ?? [];
          throw new Error(firstError?.message ?? 'Failed to load conversations');
        }

        const conversationData: ApiConversation[] = response.data ?? [];
        if (!isActive) {
          return;
        }

        const previews = conversationData
          .filter(item => item?.conversationId)
          .map(item => ({
            id: item.conversationId as string,
            title: item.title ?? 'New Conversation',
            lastMessage: '',
            timestamp: parseDate(item.updatedAt ?? item.createdAt),
          }));

        previews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setConversations(previews);

        if (previews.length > 0) {
          selectConversation(previews[0].id);
        } else {
          setMessages([]);
          setActiveConversationId(null);
        }
      } catch (fetchError) {
        if (!isActive) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load conversations',
        );
      } finally {
        if (isActive) {
          setIsLoadingConversations(false);
        }
      }
    };

    loadConversations();

    return () => {
      isActive = false;
    };
  }, [selectConversation]);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setInputText('');
    closeMenu();
  }, [closeMenu]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      setIsDeletingConversation(true);
      setError(null);

      try {
        const result = await deleteAIConversation(conversationId);
        if (!result?.success) {
          const [firstError] = result?.errors ?? [];
          throw new Error(firstError?.message ?? 'Failed to delete conversation');
        }

        setConversations(prev => prev.filter(conv => conv.id !== conversationId));

        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
          setMessages([]);
        }

        setDeletionNotice('Conversation deleted');
        setPendingDeleteId(null);
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : 'Failed to delete conversation',
        );
      } finally {
        setIsDeletingConversation(false);
      }
    },
    [activeConversationId],
  );

  const cancelDelete = useCallback(() => {
    if (isDeletingConversation) {
      return;
    }

    setPendingDeleteId(null);
  }, [isDeletingConversation]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.isBot;

    return (
      <View
        key={item.id}
        style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}
      >
        <View
          style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}
        >
          <Text
            style={[styles.messageText, isBot ? styles.botMessageText : styles.userMessageText]}
          >
            {item.text}
          </Text>
          <Text
            style={[styles.timestamp, isBot ? styles.botTimestamp : styles.userTimestamp]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={Colors[colorScheme].background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, styles.menuLineLast]} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AI Assistant</Text>

        <View style={styles.statusIndicator} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoadingMessages && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.statusMessageText}>Loading messages...</Text>
            </View>
          )}
          {error && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {deletionNotice && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.successText}>{deletionNotice}</Text>
            </View>
          )}
          {!isLoadingMessages && !error && messages.length === 0 && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.statusMessageText}>
                Start a conversation by sending a message.
              </Text>
            </View>
          )}
          {messages.map((message) => renderMessage({ item: message }))}
          {isSending && !error && (
            <View style={styles.sendingIndicatorContainer}>
              <ActivityIndicator
                size="small"
                color={palette.tint}
                style={styles.sendingIndicatorSpinner}
              />
              <Text style={styles.sendingIndicatorText}>
                Assistant is responding…
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={Colors[colorScheme].secondary}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            disabled={!inputText.trim() || isSending}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={!!pendingDeleteId}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete conversation?</Text>
            <Text style={styles.modalMessage}>
              {pendingDeleteConversation?.title
                ? `Are you sure you want to delete “${pendingDeleteConversation.title}”?`
                : 'Are you sure you want to delete this conversation?'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={cancelDelete}
                style={[styles.modalButton, styles.modalCancelButton]}
                disabled={isDeletingConversation}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  pendingDeleteId && handleDeleteConversation(pendingDeleteId)
                }
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  isDeletingConversation && styles.modalButtonDisabled,
                ]}
                disabled={isDeletingConversation}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>
                  {isDeletingConversation ? 'Deleting…' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Overlay */}
      {isMenuOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}> 
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={closeMenu}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Side Menu */}
      <Animated.View
        style={[
          styles.sideMenu,
          { width: menuWidth, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SafeAreaView style={styles.menuSafeArea}>
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderText}>Conversations</Text>
          </View>

          {/* Conversations List */}
          <ScrollView
            style={styles.conversationList}
            showsVerticalScrollIndicator={false}
          >
          {(() => {
            if (isLoadingConversations) {
              return (
                <View style={styles.statusMessageContainer}>
                  <Text style={styles.statusMessageText}>Loading conversations...</Text>
                </View>
              );
            }
            if (conversations.length === 0) {
              return (
                <View style={styles.statusMessageContainer}>
                  <Text style={styles.statusMessageText}>No conversations yet</Text>
                </View>
              );
            }
            return conversations.map((conversation) => (
              <View
                key={conversation.id}
                style={[
                  styles.conversationItem,
                  activeConversationId === conversation.id && styles.activeConversationItem,
                ]}
              >
                <TouchableOpacity
                  onPress={() => selectConversation(conversation.id)}
                  style={{ flex: 1 }}
                >
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  <Text style={styles.conversationPreview} numberOfLines={1}>
                    {conversation.lastMessage}
                  </Text>
                  <Text style={styles.conversationTimestamp}>
                    {formatDate(conversation.timestamp)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPendingDeleteId(conversation.id)}
                  style={{
                    padding: spacing.sm,
                    borderLeftColor: palette.icon,
                    borderLeftWidth: 1,
                    marginLeft: spacing.md,
                  }}
                >
                  <Trash2 color={palette.tint} />
                </TouchableOpacity>
              </View>
            ));
          })()}
        </ScrollView>

          {/* Menu Footer */}
          <View style={styles.menuFooter}>
            <TouchableOpacity
              style={styles.newConversationButton}
              onPress={startNewConversation}
            >
              <Text style={styles.newConversationText}>New Conversation</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </SafeAreaView>
  );
};

const createStyles = (colorScheme: keyof typeof Colors) => {
  const palette = Colors[colorScheme];
  const sendButtonSize = spacing.xl + spacing.sm;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.icon,
      backgroundColor: palette.surface,
    },
    menuButton: {
      padding: spacing.sm,
      marginRight: spacing.sm + spacing.xs,
    },
    menuLine: {
      width: spacing.lg - spacing.xs,
      height: 2,
      backgroundColor: palette.text,
      marginBottom: spacing.xs,
    },
    menuLineLast: {
      marginBottom: 0,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '600',
      paddingHorizontal: spacing.xl,
      color: palette.text,
    },
    statusIndicator: {
      width: spacing.sm,
      height: spacing.sm,
      borderRadius: borderRadius.xs,
      backgroundColor: palette.tint,
    },
    keyboardAvoider: {
      flex: 1,
    },
    messageList: {
      flex: 1,
      backgroundColor: palette.background,
    },
    messageListContent: {
      paddingVertical: spacing.sm + spacing.xs,
    },
    statusMessageContainer: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    statusMessageText: {
      fontSize: 14,
      color: palette.secondary,
      textAlign: 'center',
    },
    successText: {
      fontSize: 14,
      color: palette.tint,
      textAlign: 'center',
      fontWeight: '600',
    },
    sendingIndicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      width: '100%',
    },
    sendingIndicatorSpinner: {
      marginRight: spacing.sm,
    },
    sendingIndicatorText: {
      fontSize: 14,
      color: palette.secondary,
    },
    errorText: {
      fontSize: 14,
      color: '#ef4444',
      textAlign: 'center',
    },
    messageRow: {
      marginVertical: spacing.xs,
      marginHorizontal: spacing.md,
    },
    botRow: {
      flexDirection: 'row',
    },
    userRow: {
      flexDirection: 'row-reverse',
    },
    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + spacing.xs,
      borderRadius: borderRadius.lg,
    },
    botBubble: {
      backgroundColor: palette.surface,
      borderTopLeftRadius: borderRadius.xs,
      borderTopRightRadius: borderRadius.lg,
    },
    userBubble: {
      backgroundColor: palette.tint,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.xs,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
    },
    botMessageText: {
      color: palette.text,
    },
    userMessageText: {
      color: palette.foreground,
    },
    timestamp: {
      fontSize: 12,
      marginTop: spacing.xs,
    },
    botTimestamp: {
      color: palette.secondary,
      textAlign: 'left',
    },
    userTimestamp: {
      color: palette.foreground,
      textAlign: 'right',
      opacity: 0.8,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: palette.icon,
      backgroundColor: palette.surface,
    },
    messageInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: palette.icon,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + spacing.xs,
      fontSize: 16,
      backgroundColor: palette.input,
      marginRight: spacing.sm + spacing.xs,
      color: palette.text,
    },
    sendButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: sendButtonSize,
      height: sendButtonSize,
      borderRadius: sendButtonSize / 2,
      backgroundColor: palette.tint,
    },
    sendButtonDisabled: {
      backgroundColor: palette.icon,
    },
    sendButtonText: {
      color: palette.foreground,
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: `${palette.text}80`,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.text,
      marginBottom: spacing.sm,
    },
    modalMessage: {
      fontSize: 16,
      color: palette.secondary,
      marginBottom: spacing.lg,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    modalButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      marginLeft: spacing.sm,
    },
    modalCancelButton: {
      backgroundColor: palette.input,
      marginLeft: 0,
    },
    modalConfirmButton: {
      backgroundColor: palette.tint,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    modalCancelButtonText: {
      color: palette.text,
    },
    modalConfirmButtonText: {
      color: palette.foreground,
    },
    modalButtonDisabled: {
      opacity: 0.7,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${palette.text}80`,
    },
    overlayTouchable: {
      flex: 1,
    },
    sideMenu: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: palette.surface,
      shadowColor: palette.shadow,
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    menuSafeArea: {
      flex: 1,
      backgroundColor: palette.surface,
    },
    menuHeader: {
      padding: spacing.lg - spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: palette.icon,
    },
    menuHeaderText: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.text,
    },
    conversationList: {
      flex: 1,
    },
    conversationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.icon,
      justifyContent: 'space-between',

    },
    activeConversationItem: {
      backgroundColor: `${palette.tint}20`,
    },
    conversationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: spacing.xs,
    },
    conversationPreview: {
      fontSize: 14,
      color: palette.secondary,
      marginBottom: spacing.xs,
    },
    conversationTimestamp: {
      fontSize: 12,
      color: palette.secondary,
    },
    menuFooter: {
      padding: spacing.lg - spacing.xs,
      borderTopWidth: 1,
      borderTopColor: palette.icon,
      backgroundColor: palette.surface,
    },
    newConversationButton: {
      backgroundColor: palette.tint,
      paddingVertical: spacing.sm + spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    newConversationText: {
      color: palette.foreground,
      fontSize: 16,
      fontWeight: '600',
    },
    deleteIcon: {
      color: palette.tint,
    },
  });
};

export default AssistantScreen;
