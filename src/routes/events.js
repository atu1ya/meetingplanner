// src/routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Placeholder for timeBlocks utilities
function getDateBlocks(event) {
  // For now, just return 3 days
  return [
    { dayIndex: 0, label: 'Day 1' },
    { dayIndex: 1, label: 'Day 2' },
    { dayIndex: 2, label: 'Day 3' }
  ];
}
function getTimeBlocks(event) {
  // For now, just return 4 times
  return [
    { timeIndex: 0, label: '09:00' },
    { timeIndex: 1, label: '10:00' },
    { timeIndex: 2, label: '11:00' },
    { timeIndex: 3, label: '12:00' }
  ];
}

// GET / - render home.ejs with event creation form
router.get('/', (req, res) => {
  res.render('home', { error: null });
});

// POST /events - create event and redirect
router.post('/events', (req, res) => {
  try {
    const { name, start_date, end_date, min_time, max_time, timezone } = req.body;
    // Basic validation
    if (!name || !start_date || !end_date || !min_time || !max_time || !timezone) {
      return res.status(400).render('home', { error: 'All fields are required.' });
    }
    if (start_date > end_date) {
      return res.status(400).render('home', { error: 'Start date must be before or equal to end date.' });
    }
    if (min_time >= max_time) {
      return res.status(400).render('home', { error: 'Earliest time must be before latest time.' });
    }
    const event = db.createEvent({ name, start_date, end_date, min_time, max_time, timezone });
    return res.redirect(`/events/${event.id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).render('home', { error: 'Server error creating event.' });
  }
});

// GET /events/:id - show event page
router.get('/events/:id', (req, res) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  // Use placeholder dateBlocks and timeBlocks
  const dateBlocks = getDateBlocks(event);
  const timeBlocks = getTimeBlocks(event);
  // Empty mergedAvailability matrix
  const mergedAvailability = Array.from({ length: dateBlocks.length }, () => Array(timeBlocks.length).fill(0));
  res.render('event', {
    event,
    dateBlocks,
    timeBlocks,
    mergedAvailability
  });
});

module.exports = router;