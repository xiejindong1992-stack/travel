/**
 * data.js — Data loader
 * Fetches and caches all JSON data in a single parallel load.
 */
const DataStore = {
  trips: null,
  flights: null,
  plans: null,
  loaded: false,

  async load() {
    if (this.loaded) return;
    try {
      const [tripsRes, flightsRes, plansRes] = await Promise.all([
        fetch('data/trips.json'),
        fetch('data/flights.json'),
        fetch('data/plans.json')
      ]);
      if (!tripsRes.ok || !flightsRes.ok || !plansRes.ok) {
        throw new Error('Failed to load data files');
      }
      this.trips = (await tripsRes.json()).trips;
      this.flights = (await flightsRes.json()).flights;
      this.plans = (await plansRes.json()).plans;
      this.loaded = true;
    } catch (err) {
      console.error('DataStore.load error:', err);
      this.trips = [];
      this.flights = [];
      this.plans = [];
      this.loaded = true;
    }
  },

  getTrips() { return this.trips || []; },
  getFlights() { return this.flights || []; },
  getPlans() { return this.plans || []; },

  getTripBySlug(slug) {
    return (this.trips || []).find(t => t.slug === slug) || null;
  },

  getFlightsByTrip(tripId) {
    return (this.flights || []).filter(f => f.tripId === tripId);
  },

  getTripsByYear() {
    const groups = {};
    for (const trip of (this.trips || [])) {
      const year = trip.dateRange.start.slice(0, 4);
      if (!groups[year]) groups[year] = [];
      groups[year].push(trip);
    }
    // Sort years descending, each year's trips by date descending
    const sorted = {};
    Object.keys(groups).sort((a, b) => b - a).forEach(y => {
      sorted[y] = groups[y].sort((a, b) => b.dateRange.start.localeCompare(a.dateRange.start));
    });
    return sorted;
  },

  getFlightsByYear() {
    const groups = {};
    for (const flight of (this.flights || [])) {
      const year = flight.date.slice(0, 4);
      if (!groups[year]) groups[year] = [];
      groups[year].push(flight);
    }
    const sorted = {};
    Object.keys(groups).sort((a, b) => b - a).forEach(y => { sorted[y] = groups[y]; });
    return sorted;
  },

  getFlightStats() {
    const flights = this.flights || [];
    const airlines = new Set(flights.map(f => f.airline));
    const airports = new Set();
    flights.forEach(f => { airports.add(f.departure); airports.add(f.arrival); });
    const totalDist = flights.reduce((sum, f) => sum + (f.distance || 0), 0);
    return {
      total: flights.length,
      airlines: airlines.size,
      airports: airports.size,
      distance: totalDist
    };
  },

  getPlansByStatus() {
    const groups = { dreaming: [], planning: [], booked: [] };
    for (const p of (this.plans || [])) {
      if (groups[p.status]) groups[p.status].push(p);
    }
    // Sort by priority within each group
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => (a.priority || 99) - (b.priority || 99));
    }
    return groups;
  }
};
