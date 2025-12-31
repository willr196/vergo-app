/**
 * Job Detail Screen
 * Full job information with apply functionality
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, LoadingScreen, ErrorState } from '../../components';
import { useJobsStore, useApplicationsStore, useAuthStore } from '../../store';
import type { RootStackParamList, JobRole } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

const ROLE_LABELS: Record<JobRole, string> = {
  bartender: 'Bartender',
  server: 'Server',
  chef: 'Chef',
  sous_chef: 'Sous Chef',
  kitchen_porter: 'Kitchen Porter',
  event_manager: 'Event Manager',
  event_coordinator: 'Event Coordinator',
  front_of_house: 'Front of House',
  back_of_house: 'Back of House',
  runner: 'Runner',
  barista: 'Barista',
  sommelier: 'Sommelier',
  mixologist: 'Mixologist',
  catering_assistant: 'Catering Assistant',
  other: 'Other',
};

export function JobDetailScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { selectedJob, isLoading, error, fetchJob, clearSelectedJob } = useJobsStore();
  const { hasAppliedToJob, applyToJob, isSubmitting } = useApplicationsStore();
  const { user } = useAuthStore();
  
  const [hasApplied, setHasApplied] = useState(false);
  
  useEffect(() => {
    fetchJob(jobId);
    setHasApplied(hasAppliedToJob(jobId));
    
    return () => clearSelectedJob();
  }, [jobId]);
  
  const handleApply = () => {
    if (!selectedJob) return;
    
    navigation.navigate('ApplyToJob', { jobId, job: selectedJob });
  };
  
  const handleQuickApply = async () => {
    if (!selectedJob || hasApplied) return;
    
    Alert.alert(
      'Quick Apply',
      'Apply to this job with your profile? You can add a cover note on the next screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply Now', 
          onPress: () => handleApply(),
        },
      ]
    );
  };
  
  if (isLoading) {
    return <LoadingScreen message="Loading job details..." />;
  }
  
  if (error || !selectedJob) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState 
          message={error || 'Job not found'} 
          onRetry={() => fetchJob(jobId)} 
        />
      </SafeAreaView>
    );
  }
  
  const job = selectedJob;
  const spotsLeft = (job.positionsAvailable || 0) - (job.positionsFilled || 0);
  const formattedDate = formatDate(job.date);
  const formattedTime = `${formatTime(job.startTime)} - ${formatTime(job.endTime)}`;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Badge */}
        <View style={styles.badges}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{ROLE_LABELS[job.role]}</Text>
          </View>
          {job.dbsRequired && (
            <View style={styles.dbsBadge}>
              <Text style={styles.dbsText}>DBS Required</Text>
            </View>
          )}
        </View>
        
        {/* Title */}
        <Text style={styles.title}>{job.title}</Text>
        
        {/* Company */}
        {job.clientCompany && (
          <View style={styles.companyRow}>
            <View style={styles.companyLogo}>
              <Text style={styles.companyInitial}>
                {job.clientCompany.companyName.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.companyName}>{job.clientCompany.companyName}</Text>
              <Text style={styles.companyLocation}>{job.city}</Text>
            </View>
          </View>
        )}
        
        {/* Key Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{formattedTime}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Pay Rate</Text>
            <Text style={styles.infoValueGold}>£{job.hourlyRate}/hr</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Est. Total</Text>
            <Text style={styles.infoValueGold}>£{job.estimatedPay}</Text>
          </View>
        </View>
        
        {/* Spots Left */}
        <View style={[
          styles.spotsCard,
          spotsLeft <= 2 && styles.spotsCardUrgent
        ]}>
          <Text style={styles.spotsText}>
            {spotsLeft} {spotsLeft === 1 ? 'position' : 'positions'} remaining
          </Text>
          <Text style={styles.spotsSubtext}>
            {job.positionsFilled} of {job.positionsAvailable} filled
          </Text>
        </View>
        
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <Text style={styles.sectionText}>{job.venue}</Text>
          <Text style={styles.sectionTextSecondary}>
            {job.address}, {job.city} {job.postcode}
          </Text>
        </View>
        
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Job</Text>
          <Text style={styles.sectionText}>{job.description}</Text>
        </View>
        
        {/* Requirements */}
        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.sectionText}>{job.requirements}</Text>
          </View>
        )}
        
        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoListItem}>
              <Text style={styles.infoListLabel}>Experience Required</Text>
              <Text style={styles.infoListValue}>
                {job.experienceRequired === 0 
                  ? 'No experience required' 
                  : `${job.experienceRequired}+ years`}
              </Text>
            </View>
            
            <View style={styles.infoListItem}>
              <Text style={styles.infoListLabel}>DBS Check</Text>
              <Text style={styles.infoListValue}>
                {job.dbsRequired ? 'Required' : 'Not required'}
              </Text>
            </View>
            
            <View style={styles.infoListItem}>
              <Text style={styles.infoListLabel}>Uniform</Text>
              <Text style={styles.infoListValue}>
                {job.uniformRequired 
                  ? job.uniformDetails || 'Required (details provided)' 
                  : 'Not required'}
              </Text>
            </View>
            
            {job.breakDuration && (
              <View style={styles.infoListItem}>
                <Text style={styles.infoListLabel}>Break</Text>
                <Text style={styles.infoListValue}>
                  {job.breakDuration} minutes
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Fixed Apply Button */}
      <View style={styles.applyContainer}>
        {hasApplied ? (
          <View style={styles.appliedBanner}>
            <Text style={styles.appliedText}>✓ You've applied to this job</Text>
          </View>
        ) : (
          <Button
            title="Apply Now"
            onPress={handleApply}
            size="lg"
            fullWidth
            disabled={job.status !== 'published' || spotsLeft === 0}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes}${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  
  backButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    alignSelf: 'flex-start',
  },
  
  backText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  
  content: {
    flex: 1,
  },
  
  contentContainer: {
    paddingHorizontal: spacing.lg,
  },
  
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  
  roleText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  
  dbsBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  
  dbsText: {
    color: colors.warning,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  companyInitial: {
    color: colors.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  
  companyName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  companyLocation: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  infoValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  infoValueGold: {
    color: colors.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  
  spotsCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  
  spotsCardUrgent: {
    borderLeftColor: colors.error,
  },
  
  spotsText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  
  spotsSubtext: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  
  section: {
    marginBottom: spacing.lg,
  },
  
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  
  sectionText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    lineHeight: 24,
  },
  
  sectionTextSecondary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  
  infoList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  
  infoListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  
  infoListLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  
  infoListValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  applyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    ...shadows.md,
  },
  
  appliedBanner: {
    backgroundColor: colors.success + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  
  appliedText: {
    color: colors.success,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});

export default JobDetailScreen;
