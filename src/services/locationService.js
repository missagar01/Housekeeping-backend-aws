const { locationRepository } = require('../repositories/locationRepository');

class LocationService {
  listLocations() {
    return locationRepository.listAll();
  }

  createLocation(payload) {
    return locationRepository.create(payload);
  }
}

const locationService = new LocationService();

module.exports = { locationService };
