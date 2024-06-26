
const GENDER = Object.freeze({
    MALE: "male",
    FEMALE: "female",
    OTHER: "others"
});

const BIT = Object.freeze({
    ON: 1,
    OFF: 0
});

const SEQUENCE_COUNTER_TYPES = Object.freeze({
    PRODUCT_CODE: "product"
});

const PASSWORD_STATUS = Object.freeze({
    ACTIVE: "active",
    DEACTIVATED: "deactivated",
    COMPROMISED: "compromised",
    BLACKLISTED: "blacklisted"
});

const ITEM_STATUS = Object.freeze({
    ACTIVE: 'active',
    DEACTIVATED: 'deactivated',
    DELETED: 'deleted',
    APPROVED: 'approved',
});

const TASK_POINTS = Object.freeze({
    BASIC: 1,
    MEDIUM: 2,
    CHALLENGING: 3,
    HARD: 4,
    VERY_HARD: 5
});

const PRIORITY_LEVEL = Object.freeze({
    LOW: 1,
    MEDIUM: 2,
    IMPORTANT: 3,
    VERY_IMPORTANT: 4,
    INDISPENSABLE: 5
});

const TASK_STATUS = Object.freeze({
    BACKLOG: "backlog",
    TO_DO: "to_do",
    IN_PROGRESS: "in_progress",
    BLOCKED: "blocked",
    SUSPENDED: "suspended",
    COMPLETED: "completed",
    DELETED: "deleted",
    APPROVED: "approved"
});

const USER_ROLES = Object.freeze({
    ADMIN: "admin",
    SUPER_ADMIN: "super-admin"
});

export {
    GENDER,
    BIT,
    SEQUENCE_COUNTER_TYPES,
    PASSWORD_STATUS,
    ITEM_STATUS,
    TASK_POINTS,
    PRIORITY_LEVEL,
    TASK_STATUS,
    USER_ROLES
}