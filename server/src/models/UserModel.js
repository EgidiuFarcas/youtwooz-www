import User from '../database/User.js';

export default class UserModel {

    static async create(data){
        let user = new User({
            name: data.name,
            email: data.email,
            password: data.password,
        });
        return await user.save();
    }

    static async findByEmail(email){
        return await User.findOne({email: email});
    }

    static async findByID(id){
        return await User.findById(id);
    }
}