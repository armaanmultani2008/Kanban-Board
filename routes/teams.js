const express = require('express');
const router = express.Router();

const {
    createTeam,
    getTeam,
    updateTeam,
    deleteTeam,
    getMembers,
    deleteMember,
    joinTeam,
} = require('../controllers/teams');

router.route('/').post(createTeam);
router.route('/:id').get(getTeam).patch(updateTeam).delete(deleteTeam);
router.route('/:teamId/members/:userId').delete(deleteMember);
router.route('/:id/members').get(getMembers);

router.route('/join').patch(joinTeam);

module.exports = router;