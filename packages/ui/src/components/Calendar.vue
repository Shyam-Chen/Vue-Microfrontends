<script lang="ts" setup>
import { reactive, watch } from 'vue';
import { format as _format, add, sub, getYear, setYear, getMonth, setMonth } from 'date-fns';
import chunk from 'lodash/chunk';
import range from 'lodash/range';

const props = withDefaults(
  defineProps<{
    value?: string;
    currentMoment?: Date;
    format?: string;
    weekdays?: string[];
    months?: string[];
    events?: Array<{ date: Date; title: string; class?: string }>;
    startWeekOnSunday?: boolean;
    minDate?: string;
    maxDate?: string;
  }>(),
  {
    value: '',
    currentMoment: () => new Date(),
    format: 'yyyy/MM/dd',
    weekdays: () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    // prettier-ignore
    months: () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    events: () => [],
    minDate: '',
    maxDate: '',
  },
);

const emit = defineEmits<{
  (evt: 'update:value', val: string): void;
}>();

const createDays = (y?: number, m?: number) => {
  const currentPeriod = () => {
    const today = new Date();
    return [y || today.getFullYear(), typeof m === 'number' ? m : today.getMonth()];
  };

  const [year, month] = currentPeriod();
  const days = [] as Array<{
    date: Date;
    outOfRange?: boolean;
    today?: boolean;
    selected?: boolean;
    disabled?: boolean;
  }>;
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

  days.forEach((day) => {
    day.today = _format(day.date, props.format) === _format(flux.now, props.format);
    day.selected = _format(day.date, props.format) === props.value;

    if (props.minDate) {
      day.disabled =
        _format(new Date(props.minDate), props.format) > _format(day.date, props.format);
    }

    if (props.maxDate) {
      day.disabled =
        _format(new Date(props.maxDate), props.format) < _format(day.date, props.format);
    }
  });

  const chunked = chunk(days, 7);

  if (chunked[0].every((day) => day.outOfRange)) {
    chunked.splice(0, 1);
  }

  if (chunked[chunked.length - 1].every((day) => day.outOfRange)) {
    chunked.splice(chunked.length - 1, 1);
  }

  return chunked;
};

const flux = reactive({
  showWeeks: true,
  showYears: false,
  showMonths: false,

  now: new Date(),
  currentMoment: new Date(),
  currentPeriodDates: [] as any[],

  yearRange: [] as number[],
  year: null as null | number,
  months: [] as string[],
  month: null as null | number,

  today() {
    flux.currentMoment = new Date();
  },
  decrement() {
    flux.currentMoment = sub(flux.currentMoment, { months: 1 });
  },
  increment() {
    flux.currentMoment = add(flux.currentMoment, { months: 1 });
  },
  changeYearMonth() {
    if (flux.showWeeks) {
      flux.showWeeks = false;
      flux.showYears = true;
      const currentYear = getYear(flux.currentMoment);
      flux.yearRange = range(currentYear - 5, currentYear + 11);
    }
  },
  selectDateItem(val: any) {
    const date = _format(val.date, props.format);

    if (
      props.minDate &&
      _format(new Date(props.minDate), props.format) > _format(val.date, props.format)
    )
      return;
    if (
      props.maxDate &&
      _format(new Date(props.maxDate), props.format) < _format(val.date, props.format)
    )
      return;

    emit('update:value', date);
  },
  selectYear(val: number) {
    flux.showYears = false;
    flux.showMonths = true;
    flux.year = val;

    flux.currentMoment = setYear(flux.currentMoment, val);
  },
  selectMonth(val: number) {
    flux.showMonths = false;
    flux.showWeeks = true;
    flux.month = val;
    flux.currentMoment = setMonth(flux.currentMoment, val);

    flux.currentPeriodDates = createDays(getYear(flux.currentMoment), getMonth(flux.currentMoment));
  },
});

watch(
  () => flux.currentMoment,
  (val) => {
    flux.currentPeriodDates = createDays(getYear(val), getMonth(val));
  },
);

watch([() => props.value, () => props.minDate, () => props.maxDate], () => {
  flux.currentPeriodDates = createDays(getYear(flux.currentMoment), getMonth(flux.currentMoment));
});

flux.currentPeriodDates = createDays();
</script>

<template>
  <div class="p-2 shadow-lg rounded bg-white dark:bg-slate-800 w-full">
    <div class="flex justify-between items-center mb-1">
      <div class="px-2 text-2xl font-bold">
        {{ _format(flux.currentMoment, 'MMMM yyyy') }}
      </div>

      <div class="flex space-x-3">
        <div
          class="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-full"
          @click="flux.decrement"
        >
          <div class="i-fa-chevron-left w-3 h-3"></div>
        </div>

        <div
          class="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 px-2 rounded"
          @click="flux.today"
        >
          Today
        </div>

        <div
          class="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-full"
          @click="flux.increment"
        >
          <div class="i-fa-chevron-right w-3 h-3"></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-7">
      <div
        v-for="(weekday, weekdayIndex) in weekdays"
        :key="weekdayIndex"
        class="text-slate-600 text-center py-1"
      >
        {{ weekday }}
      </div>

      <template v-for="(week, weekIndex) in flux.currentPeriodDates">
        <div
          v-for="item in week"
          :key="weekIndex + item"
          class="flex flex-col hover:bg-slate-200 dark:hover:bg-slate-600 w-full p-1 gap-1 border-t-1 dark:border-slate-600"
          :class="{
            'text-white bg-blue-600 important:hover:bg-blue-700': item.selected,
            'text-slate-400 important:cursor-not-allowed': item.disabled,
            'text-slate-400 dark:text-slate-600': item.outOfRange,
          }"
          @click="flux.selectDateItem(item)"
        >
          <div
            class="self-end rounded-full"
            :class="{
              'px-2': String(item.date.getDate()).length === 1,
              'px-1': String(item.date.getDate()).length === 2,
              'text-white bg-blue-400 important:hover:bg-blue-500': item.today,
            }"
          >
            {{ item.date.getDate() }}
          </div>

          <div class="flex flex-col gap-1 h-15 overflow-auto">
            <template v-for="(event, eventIndex) in events">
              <div
                v-if="_format(event.date, 'yyyy/MM/dd') === _format(item.date, 'yyyy/MM/dd')"
                :key="eventIndex"
                class="self-start flex items-center leading-tight text-sm p-1 rounded min-w-full"
                :class="event.class ? event.class : 'bg-blue-600 text-white'"
              >
                {{ event.title }}
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
