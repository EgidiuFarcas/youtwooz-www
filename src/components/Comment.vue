<template>
    <div v-if="info && info.user" class="mb-3 flex w-full px-4 py-2 bg-gray-200 rounded-lg shadow-md">
        <div class="flex flex-row mr-2">
            <img v-if="info.user && info.user.pfp !== null" class="h-12 w-auto rounded-full" :src="apiURL + info.user.pfp" alt="">
            <img v-if="!info.user || info.user.pfp === null" class="h-12 w-auto rounded-full" src="@/assets/default_pfp.png" alt="">
        </div>
        <div class="flex flex-col w-full">
            <p class="font-bold">{{info.user.name}} <span class="text-xs px-2 py-1 rounded-lg text-white" :style="'background-color: '+info.user.role.color">{{info.user.role.name}}</span></p>
            <p class="">{{ info.text }}</p>
            <div class="mt-2 flex items-center">
                <button @click="toggleLike" :class="{'bg-black': !liked, 'bg-theme-light': liked}" class="justify-self-start text-white px-2 py-1 rounded-full outline-none focus:outline-none">
                    {{likes}} {{ (!liked) ? ' ♡ Like ' : ' ♡ Liked '}}</button>
                <button @click="deleteComment" v-if="currentUser && currentUser._id === info.user._id"
                    class="ml-auto bg-black text-white px-2 py-1 rounded-full outline-none focus:outline-none">
                    Delete
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import {apiURL} from '@/assets/variables.js';
// import AuthMiddleware from '@/middleware/AuthMiddleware.js';
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

export default {
    props:{
        info: Object,
        authenticated: Boolean,
    },
    data(){
        return {
            liked: false,
            likes: 0,
            apiURL: apiURL,
            currentUser: undefined
        }
    },
    async created(){
        this.info.user = this.info.userID;
        this.likes = this.info.likes;
        this.info.text = entities.decode(this.info.text);
        
        if(this.authenticated){
            this.currentUser = await this.getCurrentUser();
            await this.checkLiked();
        }
    },
    methods: {
        async deleteComment(){
            if(!this.authenticated) return;
            if(this.currentUser._id !== this.info.userID) return;
            await axios({
                method: 'delete',
                url: apiURL + '/api/comment/delete',
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: {
                    'commentID': this.info._id,
                }
            })
            .then(() => {
                this.$emit('commentDeleted', this.info._id);
            }).catch(err => console.log(err.response));
        },
        async getCurrentUser(){
            let user = undefined;
            await axios({
                method: "POST",
                url: apiURL + "/api/auth/info",
                headers: {
                'Authorization': this.$cookies.get('access-token')
                },
            }).then(res => user = res.data);
            return user;
        },
        toggleLike(){
            this.liked = !this.liked;
            if(this.liked) this.addLike();
            else this.removeLike();
        },
        async checkLiked(){
            if(!this.authenticated) return;
            await axios({
                method: 'post',
                url: apiURL + "/api/like/get",
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: {
                    'itemID': this.info._id
                }
            })
            .then((res) => {
                if(res.data === true) this.liked = true;
            })
            .catch(() => {
                return;
            });
        },
        addLike(){
            axios({
            method: 'post',
            url: apiURL + '/api/like/new',
            headers: {
                'Authorization': this.$cookies.get('access-token')
            },
            data: {
                'itemID': this.info._id
            }
            })
            .then(() => {
                this.likes++;
            })
            .catch(() => {
                this.liked = false;
                this.$router.push('/login');
            });
        },
        removeLike(){
            axios({
                method: 'delete',
                url: apiURL + '/api/like/delete',
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: {
                    'itemID': this.info._id
                }
            })
            .then(() => {
                this.likes--;
            })
            .catch(() => this.liked = true);
        }
    }
}
</script>