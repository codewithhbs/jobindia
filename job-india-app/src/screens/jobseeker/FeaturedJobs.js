import React, { forwardRef, useImperativeHandle } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { jobsApi } from '../../api/jobs.api';
import { useFetch } from '../../hooks/useFetch';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Loader } from '../../components/ui/Screen';
import { JobCard } from '../../components/cards/JobCard';
import { useNavigation } from '@react-navigation/native';

const MAX_FEATURED_JOBS = 20;

export const FeaturedJobs = forwardRef(
  function FeaturedJobs({ search, category, refreshing }, ref) {
    const navigation = useNavigation();

    const { data: jobsRes, loading, refetch } = useFetch(
        () => jobsApi.recomended({ search: search || undefined, isFeatured: true, category: category || undefined, limit: 20 }),
        [search, category,refreshing]
    );

    // Lets the parent (e.g. HomeScreen's pull-to-refresh) trigger a refetch.
    useImperativeHandle(ref, () => ({ refetch }), [refetch]);

    const toggleSave = async (jobId) => {
        try {
            await jobsApi.save(jobId);
        } catch (e) {
            Alert.alert('Could not save', e?.message || 'Something went wrong, please try again.');
        }
    };

    const allJobs = jobsRes?.data || [];
    const jobs = allJobs.slice(0, MAX_FEATURED_JOBS);
    const hasMore = (jobsRes?.total ?? allJobs.length) > jobs.length || allJobs.length >= MAX_FEATURED_JOBS;

    return (
        <View>
            <View style={styles.titleRow}>
                <Text style={styles.title}>
                    {category ? `${category} Jobs` : 'Featured Jobs'}
                </Text>
            </View>

            <FlatList
                data={jobs}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <JobCard
                        job={item}
                        onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
                        onSave={() => toggleSave(item._id)}
                    />
                )}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
                ListEmptyComponent={
                    loading ? <Loader text="Loading jobs..." /> : <EmptyState icon="briefcase-outline" title="No jobs found" subtitle="Try a different search or category" />
                }
            />

            {!loading && jobs.length > 0 && (
                <Pressable
                    style={styles.viewAllBtn}
                    onPress={() => navigation.navigate('JobsList', { search, category })}
                >
                    <Text style={styles.viewAllText}>View All Jobs</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </Pressable>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
    list: { paddingHorizontal: SPACING.lg },

    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.xl,
        marginHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        borderWidth: 1.5,
        borderColor: COLORS.primaryMid,
        backgroundColor: COLORS.primaryLight,
    },
    viewAllText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary },
});