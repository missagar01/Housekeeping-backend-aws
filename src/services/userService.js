const { userRepository } = require('../repositories/userRepository');

class UserService {
  create(input) {
    return userRepository.create(input);
  }

  list() {
    return userRepository.findAll();
  }

  getById(id) {
    return userRepository.findById(id);
  }

  update(id, input) {
    return userRepository.update(id, input);
  }

  remove(id) {
    return userRepository.delete(id);
  }

  listDepartments() {
    return userRepository.listByDepartment();
  }
}

const userService = new UserService();

module.exports = { userService };
