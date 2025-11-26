const { assignTaskRepository } = require('../repositories/assignTaskRepository');

class AssignTaskService {
  create(input) {
    return assignTaskRepository.create(input);
  }

  list() {
    return assignTaskRepository.findAll();
  }

  getById(id) {
    return assignTaskRepository.findById(id);
  }

  async bulkCreate(items) {
    const results = [];
    for (const item of items) {
      // sequential to keep ids/tasks ordered
      // eslint-disable-next-line no-await-in-loop
      const created = await assignTaskRepository.create(item);
      results.push(created);
    }
    return results;
  }

  update(id, input) {
    return assignTaskRepository.update(id, input);
  }

  remove(id) {
    return assignTaskRepository.delete(id);
  }
}

const assignTaskService = new AssignTaskService();

module.exports = { assignTaskService };
