import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Share,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2, Copy, Check } from 'lucide-react-native';
import { useState } from 'react';
import { useGroupStore } from '../../store/groupStore';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/uiStore';

const SHARE_CHANNELS = [
  { id: 'whatsapp', emoji: '💬', label: 'WhatsApp', color: '#25D366' },
  { id: 'messages', emoji: '📩', label: 'Messages', color: '#3B82F6' },
  { id: 'email', emoji: '📧', label: 'Email', color: '#EF4444' },
  { id: 'more', emoji: '•••', label: 'More', color: '#6B7280' },
];

export default function InviteFriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const showToast = useUIStore((state) => state.showToast);
  const groups = useGroupStore((state) => state.groups);

  const [copied, setCopied] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(groups[0] || null);

  const inviteCode = selectedGroup?.inviteCode || 'ABC123';
  const inviteLink = `billsplitter.app/invite/${inviteCode}`;

  const handleCopy = async () => {
    try {
      Clipboard.setString(inviteLink);
    } catch {
      // Fallback
    }
    setCopied(true);
    showToast('Invite link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (channel?: string) => {
    try {
      await Share.share({
        message: `Join my group on BillSplit and split expenses easily!\n\nInvite code: ${inviteCode}\nOr join via: ${inviteLink}`,
        title: 'Join my BillSplit Group',
      });
    } catch (err) {
      showToast('Could not open share sheet', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Invite Friends</Text>
        <Pressable onPress={() => handleShare()} style={styles.shareIconBtn}>
          <Share2 size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Illustration */}
        <View style={styles.illustrationBlock}>
          <Text style={styles.illustrationEmoji}>🎉</Text>
          <Text style={[styles.illustrationTitle, { color: colors.textPrimary }]}>
            Invite Friends
          </Text>
          <Text style={[styles.illustrationSubtitle, { color: colors.textSecondary }]}>
            Share this link with your friends to join the group
          </Text>
        </View>

        {/* Group selector */}
        {groups.length > 1 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SELECT GROUP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScrollRow}>
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => setSelectedGroup(g)}
                  style={[
                    styles.groupChip,
                    {
                      backgroundColor: selectedGroup?.id === g.id ? `${colors.primary}14` : colors.gray100,
                      borderColor: selectedGroup?.id === g.id ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.groupChipText, { color: selectedGroup?.id === g.id ? colors.primary : colors.textPrimary }]}>
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Invite link card */}
        <View style={[styles.linkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.linkLabel, { color: colors.textSecondary }]}>INVITE LINK</Text>
          <Text style={[styles.linkText, { color: colors.textPrimary }]} numberOfLines={1}>{inviteLink}</Text>
          <Pressable
            onPress={handleCopy}
            style={[styles.copyBtn, { backgroundColor: copied ? colors.success : colors.primary }]}
          >
            {copied ? <Check size={18} color="#FFFFFF" /> : <Copy size={18} color="#FFFFFF" />}
            <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
          </Pressable>
        </View>

        {/* Invite code */}
        <View style={[styles.codeCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>INVITE CODE</Text>
          <Text style={[styles.codeText, { color: colors.primary, letterSpacing: 8 }]}>
            {inviteCode}
          </Text>
        </View>

        {/* Share channels */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SHARE VIA</Text>
        <View style={styles.channelsRow}>
          {SHARE_CHANNELS.map((ch) => (
            <Pressable
              key={ch.id}
              onPress={() => handleShare(ch.id)}
              style={styles.channelBtn}
            >
              <View style={[styles.channelIconCircle, { backgroundColor: `${ch.color}18` }]}>
                <Text style={styles.channelEmoji}>{ch.emoji}</Text>
              </View>
              <Text style={[styles.channelLabel, { color: colors.textSecondary }]}>{ch.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  shareIconBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  illustrationBlock: { alignItems: 'center', marginBottom: 28 },
  illustrationEmoji: { fontSize: 64, marginBottom: 14 },
  illustrationTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 8 },
  illustrationSubtitle: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', lineHeight: 22 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 4,
  },
  groupScrollRow: { marginBottom: 16 },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  groupChipText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700' },

  linkCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  linkLabel: { fontSize: 10, fontFamily: 'SpaceGrotesk', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  linkText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 16 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  copyBtnText: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF' },

  codeCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: { fontSize: 10, fontFamily: 'SpaceGrotesk', fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  codeText: { fontSize: 28, fontFamily: 'SpaceGrotesk', fontWeight: '900' },

  channelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  channelBtn: { alignItems: 'center', gap: 8 },
  channelIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  channelEmoji: { fontSize: 26 },
  channelLabel: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '700' },
});
