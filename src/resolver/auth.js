const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserId, APP_SECRET } = require('./utils');

function me(parent, args, ctx, info) {
  const id = getUserId(ctx);
  return ctx.db.query.user({ where: { id } }, info);
}

async function signup(parent, { data }, ctx) {
  const password = await bcrypt.hash(data.password, 10);
  const user = await ctx.db.mutation.createUser({
    data: { ...data, password },
  });

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user,
  };
}

async function login(parent, { email, password }, ctx) {
  const user = await ctx.db.query.user({ where: { email } });
  if (!user) {
    throw new Error(`No user found for email: ${email}`);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid password');
  }

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user,
  };
}

module.exports = { me, signup, login };
