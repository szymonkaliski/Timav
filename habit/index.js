const { differenceInDays, endOfDay, startOfDay } = require("date-fns");
const { histogram } = require("d3-array");
const { scaleTime } = require("d3-scale");
const { sortBy, first, last } = require("lodash");

const { getParsedEvents } = require("../utils/paths");
const { filterEvents } = require("../utils/filter");

const chart = require("./chart");

const calculateStreak = histogram => {
  const { current, longest } = histogram.reduce(
    (acc, bin) => {
      const current = bin.length > 0 ? acc.current + 1 : 0;

      const longest =
        bin.length === 0 ? Math.max(acc.current, acc.longest) : acc.longest;

      return {
        current,
        longest
      };
    },
    { current: 0, longest: 0 }
  );

  return { longest: Math.max(longest, current), current };
};

module.exports = ({ query }) => {
  const events = sortBy(
    Object.values(filterEvents(getParsedEvents(), query)),
    e => e.start
  );

  const durationDays = differenceInDays(last(events).start, first(events).end);

  const domain = [
    startOfDay(first(events).start),
    endOfDay(new Date())
  ];

  const scale = scaleTime().domain(domain);

  const calculateHistogram = histogram()
    .value(e => e.start)
    .domain(domain)
    .thresholds(scale.ticks(durationDays));

  const result = calculateHistogram(events);
  const streak = calculateStreak(result);

  const width = Math.min(80, process.stdout.columns);
  const status =
    streak.current === streak.longest
      ? `${streak.current}d`
      : `${streak.current}d / ${streak.longest}d`;

  let info = query;
  info += " ".repeat(width - info.length - status.length);
  info += status;

  console.log(info);
  console.log(chart(result, width));
};
