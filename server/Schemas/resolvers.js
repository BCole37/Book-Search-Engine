const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id }).select('-__v -password').populate('books');
                return userData;
            }
            throw new AuthenticationError("You need to be logged in!");
        },
    },

    Mutation: {
        addUser: async (parent, newUser, context) => {
            const user = await User.create(newUser);
            if (!user) {
                throw new AuthenticationError("error");
            }
            const token = signToken(user);
            return { token, user };
        },
        login: async (_, { username, email, password }) => {
            const user = await User.findOne({
                $or: [{ username: username }, { email: email }],
            });
            if (!user) {
                throw new AuthenticationError("Cant find this user");
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError("Incorrect credentials");
            }
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, book, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: book } },
                    { new: true, runValidators: true }
                );

                return updatedUser;
            }
            throw new AuthenticationError("You need to be logged in!");
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                );
                return updatedUser;
                }
                if (!updatedUser) {
                    throw new AuthenticationError('You need to be logged in!');
                }
           
        },
    },
};

module.exports = resolvers;