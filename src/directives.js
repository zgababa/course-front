const { SchemaDirectiveVisitor } = require('graphql-tools');
const { defaultFieldResolver } = require('graphql');
const { getUser } = require('graphql-authentication');

function not(value) {
  return !value;
}

function isAdmin(role) {
  return role === 'ADMIN';
}

function isUser(role) {
  return role === 'USER';
}

function isMatchRole(role, roleToMatch) {
  return role === roleToMatch;
}

function isSameUser(userId, userIdToMatch) {
  return userId === userIdToMatch;
}

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type);
    type.requiredAuthRole = this.args.requires;
  }

  // Visitor methods for nested types like fields and arguments
  // also receive a details object that provides information about
  // the parent and grandparent types.
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field.requiredAuthRole = this.args.requires;
  }

  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      field.resolve = async function (...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredRole = field.requiredAuthRole
          || objectType.requiredAuthRole;

        if (!requiredRole) {
          return resolve.apply(this, args);
        }

        const context = args[2];
        const user = await getUser(context);
        const { role, id: userId } = user;
        const userIdFromArgs = get(args[1], 'where.id');

        if (not(isAdmin(role))) {
          if (not(isMatchRole(role, requiredRole))) {
            throw new Error(`Not authorized, you have to be ${requiredRole}`);
          } else if (isUser(role) && userIdFromArgs) {
            if (not(isSameUser(userId, userIdFromArgs))) {
              throw new Error('Not authorized, you have to be the user of this resource');
            }
          }
        }

        return resolve.apply(this, args);
      };
    });
  }
}

module.exports = {
  AuthDirective,
};
