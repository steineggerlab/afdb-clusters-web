import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify/lib';
import { create } from 'axios';
import Portal from './lib/vue-simple-portal';
import { NglService } from './NglService.mjs';

import {
    mdiHistory,
    mdiChevronLeft,
    mdiChevronRight,
    mdiClockOutline,
    mdiAlertCircleOutline,
    mdiHelpCircleOutline,
    mdiMagnify,
    mdiTune,
    mdiDns,
    mdiReorderHorizontal,
    mdiDelete,
    mdiFileDownloadOutline,
    mdiCloudDownloadOutline,
    mdiFormatListBulleted,
    mdiLabel,
    mdiLabelOutline,
    mdiNotificationClearAll,
    mdiProgressWrench,
    mdiRestore,
    mdiFullscreen,
    mdiArrowRightCircle,
    mdiArrowRightCircleOutline,
    mdiCircle,
    mdiCircleHalf,
    mdiPlusBox,
    mdiMinusBox,
} from '@mdi/js'

Vue.use(VueRouter);
Vue.use(Vuetify);
Vue.use(Portal);

import App from './App.vue';
import Search from './Search.vue';
import Cluster from './Cluster.vue';

window.document.title = "AFDB Clusters";

const router = new VueRouter({
    mode: 'history',
    routes: [
        { path: '/', redirect: { name: 'search' } },
        { name: 'search', path: '/', component: Search },
        { name: 'cluster', path: '/cluster/:cluster', component: Cluster },
    ],
    linkActiveClass: 'active'
});

const mq = window.matchMedia('(prefers-color-scheme: dark)')

const vuetify = new Vuetify({
    icons: {
        iconfont: 'mdiSvg',
    },
    theme: { dark: mq.matches },
})

mq.addEventListener('change', (e) => {
    vuetify.framework.theme.dark = e.matches;
})

Vue.use({
    install(Vue, options) {
        Vue.prototype.$MDI = {
            History: mdiHistory,
            ChevronLeft: mdiChevronLeft,
            ChevronRight: mdiChevronRight,
            ClockOutline: mdiClockOutline,
            AlertCircleOutline: mdiAlertCircleOutline,
            HelpCircleOutline: mdiHelpCircleOutline,
            Magnify: mdiMagnify,
            Tune: mdiTune,
            Dns: mdiDns,
            ReorderHorizontal: mdiReorderHorizontal,
            Delete: mdiDelete,
            FileDownloadOutline: mdiFileDownloadOutline,
            CloudDownloadOutline: mdiCloudDownloadOutline,
            FormatListBulleted: mdiFormatListBulleted,
            Label: mdiLabel,
            LabelOutline: mdiLabelOutline,
            NotificationClearAll: mdiNotificationClearAll,
            ProgressWrench: mdiProgressWrench,
            Restore: mdiRestore,
            Fullscreen: mdiFullscreen,
            ArrowRightCircle: mdiArrowRightCircle,
            ArrowRightCircleOutline: mdiArrowRightCircleOutline,
            Circle: mdiCircle,
            CircleHalf: mdiCircleHalf,
            PlusBox: mdiPlusBox,
            MinusBox: mdiMinusBox,
        };
        let apiBase = "http://localhost:3000/api";
        // let apiBase = "/api";
        let defaultHeaders = {};

        const axiosConfig = {
            baseURL: apiBase,
            headers: defaultHeaders
        };

        Vue.prototype.$axios = create(axiosConfig);
        Vue.prototype.$nglService = new NglService();
    }
});

const app = new Vue({
    el: '#app',
    router,
    vuetify,
    render: h => h(App)
});

// make sure our CSS is load last
import './assets/style.css';