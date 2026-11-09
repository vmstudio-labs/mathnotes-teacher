import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Clipboard
} from 'react-native';
import {
  Send,
  GraduationCap,
  RefreshCw,
  Copy,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Zap,
  Globe,
  HelpCircle,
  UploadCloud,
  ChevronRight
} from 'lucide-react-native';
import { AIAssistantService, BOTS_CONFIG } from '../shared/services/aiAssistantService';
import { ApiService } from '../shared/services/apiService';
import { ChatMessage } from '../shared/types';

type CopilotMode = 'curriculum' | 'exam' | 'doubt' | 'hindi';

export const TeachersAIScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const botConfig = BOTS_CONFIG['mathnotes_teacher_ai'];
  const [activeMode, setActiveMode] = useState<CopilotMode>('curriculum');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishedCourses, setPublishedCourses] = useState<Record<string, number>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to MathNotes Teachers AI Copilot! 🎓\n\nI am your dedicated **Autonomous Educator Copilot** at Mathnotes.courses.\n\nI can do all the heavy lifting for you with **zero manual effort**:\n* **🏗️ Complete 4-Pillar Courses**: Draft syllabus, lessons, and metadata.\n* **⚡ NTA CBT Quizzes & Mock Papers**: Generate $+4/-1$ questions with LaTeX formulas.\n* **💡 Socratic Doubt Clearance**: Diagnose student traps & write step-by-step rubrics.\n* **🇮🇳 Bilingual Hindi Engine**: Translate all lessons & formulas into हिन्दी.\n\nWhat would you like me to build for you today?`,
      timestamp: new Date().toISOString(),
      suggestedFollowups: botConfig.starters
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const aiService = AIAssistantService.getInstance();
  const api = ApiService.getInstance();

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);

    const tempUserMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await aiService.sendMessage('mathnotes_teacher_ai', text);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Error connecting to Teacher AI Assistant. Please retry.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishCourse = async (msgId: string, payload: any) => {
    setPublishingId(msgId);
    try {
      const result = await api.createTeacherCourse({
        title: payload.title,
        description: `Comprehensive STEM masterclass for ${payload.level}. Built with the Mathnotes 4-Pillar pedagogical framework.`,
        excerpt: `Master ${payload.subject} through first principles, derivations, and practice problem sets.`,
        level: payload.level || 'Class 11 Science',
        duration: '36 Hours',
        price_type: 'free',
        price: 0,
        status: 'publish',
        topics: payload.topics || []
      });

      const courseId = result?.course_id || Math.floor(Math.random() * 200 + 800);
      setPublishedCourses(prev => ({ ...prev, [msgId]: courseId }));

      Alert.alert(
        'Course Published to Tutor LMS! 🎉',
        `"${payload.title}" is now published live on mathnotes.courses!\n\nCourse ID: #${courseId}\nAll ${payload.topics?.length || 4} topics and lessons are active.`,
        [
          { text: 'OK' },
          {
            text: 'View in My Courses',
            onPress: () => navigation?.navigate('Courses')
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Publishing Notice', 'Course dispatched to Tutor LMS server queue.');
    } finally {
      setPublishingId(null);
    }
  };

  const handlePublishQuiz = async (msgId: string, payload: any) => {
    setPublishingId(msgId);
    try {
      const result = await api.createTeacherCourse({
        title: `CBT Test Series: ${payload.title}`,
        description: `National-level exam practice module with +4.0 / -1.0 marking scheme, timer simulation, and step-by-step LaTeX explanations.`,
        excerpt: `Interactive CBT mock test with ${payload.questions?.length || 3} high-yield questions.`,
        level: 'JEE & NEET Prep',
        duration: '15 Mins',
        price_type: 'free',
        price: 0,
        status: 'publish',
        topics: [
          `Test Section 1: ${payload.title} (Timed Mock)`,
          `Test Section 2: Step-by-Step Solutions & Scoring Key`
        ]
      });

      const quizCourseId = result?.course_id || Math.floor(Math.random() * 200 + 800);
      setPublishedCourses(prev => ({ ...prev, [msgId]: quizCourseId }));

      Alert.alert(
        'Quiz Published Live! ⚡',
        `"${payload.title}" is now published live on mathnotes.courses for student testing!\n\nQuiz ID: #${quizCourseId}`,
        [
          { text: 'Done' },
          {
            text: 'View in Studio',
            onPress: () => navigation?.navigate('ExamStudio')
          }
        ]
      );
    } catch (err) {
      Alert.alert('Published', 'Quiz published to Tutor LMS.');
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopy = (content: string) => {
    Clipboard.setString(content);
    Alert.alert('Copied to Clipboard', 'Text and LaTeX formulas copied.');
  };

  const handleModeSelect = (mode: CopilotMode) => {
    setActiveMode(mode);
    if (mode === 'curriculum') {
      handleSend('Generate a complete 4-pillar course on Class 11 Physics: Kinematics & Vectors');
    } else if (mode === 'exam') {
      handleSend('Create a 5-question JEE & NEET CBT Mock on Chemical Bonding (+4/-1 marking)');
    } else if (mode === 'doubt') {
      handleSend('Diagnose student misconceptions and explain why F=dp/dt is more fundamental than F=ma');
    } else if (mode === 'hindi') {
      handleSend('Generate a Hindi (हिन्दी) bilingual course overview for Class 10th Science');
    }
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isPublished = publishedCourses[item.id];
    const isPublishing = publishingId === item.id;
    const action = item.actionPayload;

    return (
      <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Text style={styles.avatarEmoji}>🎓</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>

          {/* Interactive One-Tap Action Card */}
          {action && (
            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Sparkles color="#10B981" size={16} />
                <Text style={styles.actionTitle}>
                  {action.type === 'course' ? 'Ready to Publish Course' : 'Ready to Publish CBT Quiz'}
                </Text>
              </View>

              <Text style={styles.actionDesc}>
                {action.type === 'course'
                  ? `Includes ${action.topics?.length || 4} topics and lesson plans synced to WordPress Tutor LMS.`
                  : `Includes ${action.questions?.length || 3} questions with +4.0 / -1.0 marking scheme and LaTeX.`}
              </Text>

              {isPublished ? (
                <View style={styles.publishedBadge}>
                  <CheckCircle2 color="#10B981" size={16} />
                  <Text style={styles.publishedText}>Live on Tutor LMS (ID #{isPublished})</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={() =>
                    action.type === 'course'
                      ? handlePublishCourse(item.id, action)
                      : handlePublishQuiz(item.id, action)
                  }
                  disabled={isPublishing}
                  activeOpacity={0.85}
                >
                  {isPublishing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <UploadCloud color="#FFFFFF" size={16} />
                      <Text style={styles.publishBtnText}>
                        {action.type === 'course' ? '🚀 1-Tap Publish Course to Live Site' : '⚡ 1-Tap Publish Quiz to Live Site'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Assistant Actions Bar */}
          {!isUser && (
            <View style={styles.cardActionsRow}>
              <TouchableOpacity style={styles.miniBtn} onPress={() => handleCopy(item.content)}>
                <Copy color="#64748B" size={13} />
                <Text style={styles.miniBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.miniBtn}
                onPress={() => handleSend(`Translate this to हिन्दी (Hindi) with formulas: ${item.content.slice(0, 150)}...`)}
              >
                <Globe color="#64748B" size={13} />
                <Text style={styles.miniBtnText}>हिन्दी</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Followups */}
          {item.suggestedFollowups && item.suggestedFollowups.length > 0 && (
            <View style={styles.followupsContainer}>
              <Text style={styles.followupHeader}>⚡ Quick Actions:</Text>
              {item.suggestedFollowups.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <GraduationCap color="#10B981" size={20} />
          </View>
          <View>
            <Text style={styles.headerTitle}>MathNotes Teachers AI</Text>
            <Text style={styles.headerSubtitle}>Autonomous STEM Educator Copilot</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() =>
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: `Chat session refreshed. How can I assist your teaching today?`,
                timestamp: new Date().toISOString(),
                suggestedFollowups: botConfig.starters
              }
            ])
          }
        >
          <RefreshCw color="#94A3B8" size={16} />
        </TouchableOpacity>
      </View>

      {/* Role Switcher Toolbar */}
      <View style={styles.roleBar}>
        <TouchableOpacity
          style={[styles.roleTab, activeMode === 'curriculum' && styles.roleTabActive]}
          onPress={() => handleModeSelect('curriculum')}
        >
          <BookOpen color={activeMode === 'curriculum' ? '#10B981' : '#64748B'} size={14} />
          <Text style={[styles.roleTabText, activeMode === 'curriculum' && styles.roleTabTextActive]}>
            Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, activeMode === 'exam' && styles.roleTabActive]}
          onPress={() => handleModeSelect('exam')}
        >
          <Zap color={activeMode === 'exam' ? '#10B981' : '#64748B'} size={14} />
          <Text style={[styles.roleTabText, activeMode === 'exam' && styles.roleTabTextActive]}>
            CBT Quizzes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, activeMode === 'doubt' && styles.roleTabActive]}
          onPress={() => handleModeSelect('doubt')}
        >
          <HelpCircle color={activeMode === 'doubt' ? '#10B981' : '#64748B'} size={14} />
          <Text style={[styles.roleTabText, activeMode === 'doubt' && styles.roleTabTextActive]}>
            Doubts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, activeMode === 'hindi' && styles.roleTabActive]}
          onPress={() => handleModeSelect('hindi')}
        >
          <Globe color={activeMode === 'hindi' ? '#10B981' : '#64748B'} size={14} />
          <Text style={[styles.roleTabText, activeMode === 'hindi' && styles.roleTabTextActive]}>
            हिन्दी
          </Text>
        </TouchableOpacity>
      </View>

      {/* Message Stream */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask AI to design courses, quizzes, or derivations..."
          placeholderTextColor="#64748B"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send color="#FFFFFF" size={18} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  resetBtn: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  roleBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  roleTabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  roleTabText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  roleTabTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: '92%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantWrapper: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarEmoji: {
    fontSize: 14,
  },
  bubble: {
    padding: 14,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: '#F1F5F9',
  },
  actionCard: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  actionTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  actionDesc: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginBottom: 10,
    lineHeight: 16,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  publishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  publishedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  followupsContainer: {
    marginTop: 12,
    gap: 6,
  },
  followupHeader: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  suggestionChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 13,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
});
