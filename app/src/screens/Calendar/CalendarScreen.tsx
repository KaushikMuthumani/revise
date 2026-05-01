import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, gradeColor } from '../../theme/colors';
import { getDashboardCalendar } from '../../api/profile';
import { getTopics } from '../../api/topics';
import { Topic } from '../../api/topics';
import { TopicCard } from '../../components/TopicCard';
import { toDateString, formatMonthYear } from '../../utils/dateUtils';

type Props = { navigation: NativeStackNavigationProp<any> };

export function CalendarScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [currentMonth, setCurrentMonth] = useState(toDateString(new Date()).slice(0, 7));
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalendar(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadTopicsForDate(selectedDate);
  }, [selectedDate]);

  async function loadCalendar(month: string) {
    setIsLoading(true);
    try {
      const { calendar } = await getDashboardCalendar(month);
      const marks: Record<string, any> = {};
      for (const [date, info] of Object.entries(calendar as any)) {
        const dots = (info as any).grades.slice(0, 3).map((g: string) => ({
          color: gradeColor(g),
          selectedDotColor: gradeColor(g),
        }));
        marks[date] = { dots, marked: true };
      }
      // Highlight selected date
      if (marks[selectedDate]) {
        marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: Colors.primaryLight };
      } else {
        marks[selectedDate] = { selected: true, selectedColor: Colors.primaryLight };
      }
      setMarkedDates(marks);
    } catch {}
    setIsLoading(false);
  }

  async function loadTopicsForDate(date: string) {
    try {
      const topics = await getTopics({ status: undefined });
      setSelectedTopics(topics.filter((t) => t.next_revision_due === date));
    } catch {}
  }

  function handleDayPress(day: any) {
    setSelectedDate(day.dateString);
  }

  const today = toDateString(new Date());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity
          style={styles.todayBtn}
          onPress={() => {
            setSelectedDate(today);
            setCurrentMonth(today.slice(0, 7));
          }}
        >
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        onMonthChange={(month: any) => setCurrentMonth(month.dateString.slice(0, 7))}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: Colors.white,
          calendarBackground: Colors.white,
          textSectionTitleColor: Colors.gray500,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: Colors.white,
          todayTextColor: Colors.primary,
          dayTextColor: Colors.gray900,
          textDisabledColor: Colors.gray200,
          arrowColor: Colors.primary,
          monthTextColor: Colors.gray900,
          indicatorColor: Colors.primary,
        }}
      />

      <View style={styles.divider} />

      {/* Topics for selected date */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>
          {selectedDate === today ? 'Today' : selectedDate}
        </Text>
        <Text style={styles.dayCount}>
          {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={selectedTopics}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No revisions due on this day.</Text>
          }
          renderItem={({ item }) => (
            <TopicCard
              topic={item}
              onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
              showReviseButton={false}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.gray900 },
  todayBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  todayBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.gray100, marginTop: 8 },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  dayCount: { fontSize: 13, color: Colors.gray400 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { color: Colors.gray300, textAlign: 'center', marginTop: 24, fontSize: 14 },
});
