<template>
    <div class="p-4 text-center font-raleway font-light mx-auto md:w-3/4 lg:w-1/2 xl:w-2/4 2xl:w-1/3">
        <p class="w-full text-left">
            <span class="text-lg underline"><router-link to="/account">Account</router-link></span>
            <span class="float-right text-lg underline"><router-link to="/">Home</router-link></span>
        </p>
        <h1 class="text-2xl mb-2">Submission Creator</h1>
        <div class="shadow-md rounded-lg w-full flex flex-col border-solid border-t-8 border-theme-dark">
            <div id="errorBox" class="hidden m-4 bg-red-500 text-white p-2 rounded shadow-md">
                This is an error message, please fix your problem.
            </div>
            <!-- PAGE 1 - Name, box, type -->
            <Page1 v-if="info !== null && pageNR === 1" id="page1" ref="p1" :eName="info.name" :eHasBox="info.hasBox" :eType="info.type" class="page"/>
            <!-- PAGE 2 - Description -->
            <Page2 v-if="info !== null && pageNR === 2" id="page2" ref="p2" :eDescription="info.description" class="page"/>
            <!-- PAGE 3 - Category, price, height, artists -->
            <Page3 v-if="info !== null && pageNR === 3" id="page3" ref="p3" :type="info.type" :info="info" class="page"/>
            <!-- PAGE 4 - Images -->
            <Page4 v-if="info !== null && pageNR === 4" id="page4" ref="p4" :type="info.type" :info="info"
                :hasBox="info.hasBox" :submissionID="submissionID" class="page"/>
            
            <input type="hidden" v-model="submissionID">

            <div class="my-4 px-4">
                <div class="w-full flex flex-row">
                    <button v-if="pageNR > 1" @click="prevPage" class="px-4 py-2 w-full mr-4 bg-theme-light text-white hover:bg-theme-dark outline-none focus:outline-none">Previous</button>
                    <button v-if="pageNR < 4" @click="nextPage" class="px-4 py-2 w-full bg-theme-light text-white hover:bg-theme-dark outline-none focus:outline-none" :class="{'ml-4': pageNR > 1}">Next</button>
                    <button v-if="pageNR === 4" @click="finishForm" class="px-4 py-2 w-full border-solid border-2 border-theme-light bg-white text-theme-light hover:bg-theme-light hover:text-white outline-none focus:outline-none">Finish</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Page1 from '@/components/SubmissionCreator/Page1.vue';
import Page2 from '@/components/SubmissionCreator/Page2.vue';
import Page3 from '@/components/SubmissionCreator/Page3.vue';
import Page4 from '@/components/SubmissionCreator/Page4.vue';

import axios from 'axios';
import {apiURL} from '@/assets/variables.js';

export default {
    components: {
        Page1, Page2, Page3, Page4
    },
    data(){
        return {
            pageNR: 1,
            submissionID: '',
            p1: Page1.data,
            p2: Page2.data,
            p3: Page3.data,
            type: '',
            hasBox: '',
            info: null,
        }
    },
    async mounted(){
        this.submissionID = this.$route.params.id;
        await this.fetchSubmissionInfo();
        this.pageNR = 2;
        if(this.info.description !== undefined) this.pageNR = 3;
        if(this.info.categoryID !== undefined) this.pageNR = 4;
        this.displayPage();
    },
    methods: {
        async fetchSubmissionInfo(){
            if(!this.$route.params.id) this.$router.push('/account');
            else this.submissionID = this.$route.params.id;
            await axios({
                method: "POST",
                url: apiURL + "/api/submission/info",
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: {
                    'submissionID': this.$route.params.id
                }
            })
            .then(res => {
                this.info = res.data;
                switch(this.info.type){
                    case 0: this.info.type = "2D"; break;
                    case 1: this.info.type = "3D"; break;
                    case 2: this.info.type = "2D+3D"; break;
                }
                this.type = this.info.type;
                this.hasBox = this.info.hasBox;
            })
            .catch(err => console.log(err.response));
        },
        async finishForm(){
            let p4Data = this.$refs.p4;
            this.hideErrorBox();
            if(this.hasBox === true && p4Data.conceptBoxFileUploaded === false){
                this.displayError('Box Concept image required.');
                return;
            }
            if((this.type === '2D' || this.type === '2D+3D') && p4Data.concept2DFileUploaded === false){
                this.displayError('2D Concept image required.');
                return;
            }
            if((this.type === '3D' || this.type === '2D+3D') && p4Data.concept3DFileUploaded === false){
                this.displayError('3D Concept image required.');
                return;
            }
            axios({
                method: "POST",
                url: apiURL + "/api/submission/status",
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: {
                    'submissionID': this.submissionID,
                    'status': 'pending automated review',
                    'statusMessage': 'Form Complete.'
                }
            })
            .then(() => this.$router.push('/account'))
            .catch(err => this.displayError(err.response.data));
        },
        async submitPage1(){
            let response = 'BAD';
            let p1Data = this.$refs.p1;
            let payload = {
                    'submissionID': this.submissionID,
                    'name': p1Data.name,
                    'type': p1Data.type,
                    'hasBox': p1Data.hasBox
            };
            await axios({
                method: "POST",
                url: apiURL + "/api/submission/new/one",
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: payload
            })
            .then(res => {
                this.hideErrorBox();
                this.submissionID = res.data;
                response = 'OK';
            })
            .catch(err => {
                let errMsg = err.response.data;
                errMsg = errMsg.replace(/"/g, '');
                errMsg = errMsg.charAt(0).toUpperCase() + errMsg.slice(1);
                this.displayError(errMsg)
            });
            await this.fetchSubmissionInfo();
            return response;
        },
        async submitPage2(){
            let response = 'BAD';
            let p2Data = this.$refs.p2;
            let payload = {
                'submissionID': this.submissionID,
                'description': p2Data.description
            };
            await axios({
                method: "POST",
                url: apiURL + "/api/submission/new/two",
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: payload
            })
            .then(() => {
                this.hideErrorBox();
                response = 'OK';
            })
            .catch(err => {
                let errMsg = err.response.data;
                errMsg = errMsg.replace(/"/g, '');
                errMsg = errMsg.charAt(0).toUpperCase() + errMsg.slice(1);
                this.displayError(errMsg)
            });
            await this.fetchSubmissionInfo();
            return response;
        },
        async submitPage3(){
            let response = 'BAD';
            let p3Data = this.$refs.p3;
            let payload = {
                'submissionID': this.submissionID,
                'height': p3Data.height,
                'categoryID': p3Data.category,
                'priceID': p3Data.price,
                'artist2D': p3Data.artist2D,
                'artist3D': p3Data.artist3D,
                'gradientFrom': p3Data.gradientFrom,
                'gradientTo': p3Data.gradientTo,
            };
            await axios({
                method: "POST",
                url: apiURL + "/api/submission/new/three",
                headers: {
                    'Authorization': this.$cookies.get('access-token')
                },
                data: payload
            })
            .then(() => {
                this.hideErrorBox();
                response = 'OK';
            })
            .catch(err => {
                let errMsg = err.response.data;
                errMsg = errMsg.replace(/"/g, '');
                errMsg = errMsg.charAt(0).toUpperCase() + errMsg.slice(1);
                this.displayError(errMsg)
            });
            await this.fetchSubmissionInfo();
            return response;
        },
        async submitInfo(){
            switch(this.pageNR){
                case 1: 
                    return await this.submitPage1();
                case 2:
                    return await this.submitPage2();
                case 3: 
                    return await this.submitPage3();
            }
        },
        displayPage(){
            let pages = document.getElementsByClassName('page');
            pages.forEach(page => {
                if(page.id !== 'page'+this.pageNR) page.classList.add('hidden');
                else page.classList.remove('hidden');
            });
        },
        prevPage(){
            this.pageNR -= 1;
            if(this.pageNR < 1) this.pageNR = 1;
            this.displayPage();
        },
        async nextPage(){
            let res = await this.submitInfo();
            if(res !== 'OK') return;
            this.pageNR += 1;
            if(this.pageNR > 4) this.pageNR = 4;
            this.displayPage();
        },
        displayError(err){
            let errBox = document.getElementById('errorBox');
            errBox.innerHTML = err;
            errBox.classList.remove('hidden');
        },
        hideErrorBox(){
            let errBox = document.getElementById('errorBox');
            errBox.classList.add('hidden');
        }
    }
}
</script>