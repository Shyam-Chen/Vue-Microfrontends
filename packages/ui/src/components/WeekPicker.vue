<script lang="ts" setup>
import { ref, computed } from 'vue';
import { format, getISOWeek, getYear, getMonth, sub, add } from 'date-fns';
import chunk from 'lodash/chunk';

import TextField from './TextField.vue';
import Fade from './Fade.vue';

const props = defineProps<{
  value?: [year?: number, week?: number] | never[];
}>();

const emit = defineEmits<{
  (evt: 'update:value', val: [year?: number, week?: number] | never[]): void;
}>();

const weekValue = computed({
  get: () => props.value || [],
  set: (val) => emit('update:value', val),
});

const currentMoment = ref(new Date());
const show = ref(false);

const createWeeks = (y?: number, m?: number) => {
  const currentPeriod = () => {
    const today = new Date();
    return [y || today.getFullYear(), typeof m === 'number' ? m : today.getMonth()];
  };

  const [year, month] = currentPeriod();

  const days = [] as Array<{ date?: Date; outOfRange?: boolean; week?: number }>;

  const date = new Date(year, month, 1);

  const offset = 1;

  const startDay = date.getDay() || 7;

  if (startDay > 1 - offset) {
    for (let i = startDay - (2 - offset); i >= 0; i--) {
      const prevDate = new Date(date);
      prevDate.setDate(-i);
      days.push({ outOfRange: true, date: prevDate });
    }
  }

  while (date.getMonth() === month) {
    days.push({ date: new Date(date) });
    date.setDate(date.getDate() + 1);
  }

  const daysLeft = 7 - (days.length % 7);

  for (let i = 1; i <= daysLeft; i++) {
    const nextDate = new Date(date);
    nextDate.setDate(i);
    days.push({ outOfRange: true, date: nextDate });
  }

  return chunk(days, 7).map((week) => [{ week: getISOWeek(week[6].date || 0) }, ...week]);
};

const weeks = ref(createWeeks(getYear(currentMoment.value), getMonth(currentMoment.value)));

const weekdays = ['Week', 'S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Week = Array<{ date?: Date; outOfRange?: boolean; week?: number }>;

function openPicker() {
  show.value = true;
}

function decrement() {
  currentMoment.value = sub(currentMoment.value, { months: 1 });
  weeks.value = createWeeks(getYear(currentMoment.value), getMonth(currentMoment.value));
}

function increment() {
  currentMoment.value = add(currentMoment.value, { months: 1 });
  weeks.value = createWeeks(getYear(currentMoment.value), getMonth(currentMoment.value));
}

function selectWeek(week: Week) {
  const isoWeek = week[0].week;
  const start = week[1].date && getYear(week[1].date);
  const end = week[7].date && getYear(week[7].date);

  let year = end;
  if (week[0].week === 52) year = start;

  weekValue.value = [year, isoWeek];
  show.value = false;
}

function formatWeekValue(val: typeof weekValue.value) {
  if (val?.length) {
    const [year, week] = val;
    return `${year}-W${week}`;
  }

  return '';
}
</script>

<template>
  <div class="w-full">
    <TextField
      :value="formatWeekValue(weekValue)"
      append="i-mdi-calendar-week"
      readonly
      @focus="openPicker"
      @append="openPicker"
    />

    <Fade>
      <div v-if="show" class="fixed z-10 p-2 shadow-lg rounded bg-white dark:bg-slate-800">
        <div class="flex justify-between items-center mb-1">
          <div
            class="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-full"
            @click="decrement"
          >
            <div class="i-fa-chevron-left w-3 h-3"></div>
          </div>

          <div class="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 px-2 rounded">
            {{ format(currentMoment, 'MMM yyyy') }}
          </div>

          <div
            class="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-full"
            @click="increment"
          >
            <div class="i-fa-chevron-right w-3 h-3"></div>
          </div>
        </div>

        <div class="space-y-1">
          <div class="grid grid-cols-8 gap-1 text-center">
            <div
              v-for="(weekday, weekdayIndex) in weekdays"
              :key="weekdayIndex"
              class="text-sm text-slate-600"
            >
              {{ weekday }}
            </div>
          </div>

          <div
            v-for="(week, weekIndex) in weeks"
            :key="weekIndex"
            class="grid grid-cols-8 gap-1 text-center hover:bg-primary-500 hover:text-white hover:rounded cursor-pointer"
            @click="selectWeek(week)"
          >
            <div
              v-for="(item, idx) in week"
              :key="idx"
              class="flex justify-center items-center"
              :class="{
                'font-bold': item.week,
                'text-slate-600': item.outOfRange,
              }"
            >
              {{ item.week ? item.week : item.date?.getDate() }}
            </div>
          </div>
        </div>
      </div>
    </Fade>
  </div>
</template>
