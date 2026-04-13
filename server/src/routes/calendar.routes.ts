import { Router } from 'express';
import { getCalendarEntries, getUpcomingEarnings } from '../models/calendar.model.ts';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

const router = Router();

router.get('/', async (req, res) => {
  const { from, to } = req.query;
  let fromDate: string;
  let toDate: string;

  if (from && to) {
    fromDate = from as string;
    toDate = to as string;
  } else {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const friday = addDays(monday, 4);
    fromDate = format(monday, 'yyyy-MM-dd');
    toDate = format(friday, 'yyyy-MM-dd');
  }

  const entries = await getCalendarEntries(fromDate, toDate);
  res.json({ from: fromDate, to: toDate, entries });
});

router.get('/upcoming', async (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const entries = await getUpcomingEarnings(days);
  res.json(entries);
});

router.get('/week/:weekOf', async (req, res) => {
  const date = new Date(req.params.weekOf);
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const friday = addDays(monday, 4);
  const fromDate = format(monday, 'yyyy-MM-dd');
  const toDate = format(friday, 'yyyy-MM-dd');

  const entries = await getCalendarEntries(fromDate, toDate);
  res.json({ from: fromDate, to: toDate, entries });
});

export default router;
