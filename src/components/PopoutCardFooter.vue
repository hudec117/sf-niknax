<script setup lang="ts">
import { ref } from 'vue';

import AboutModal from './modals/about/AboutModal.vue';

const aboutModal = ref<InstanceType<typeof AboutModal> | null>(null);

function onAboutClick() {
    aboutModal.value?.show();
}
</script>

<template>
    <footer class="slds-card__footer slds-p-vertical_x-small">
        <div class="slds-grid">
            <div class="slds-col">
                <span class="slds-float_left">Made with &#10084;&#65039; on <a href="https://github.com/hudec117/sf-niknax" class="external-link" target="_blank">GitHub</a></span>
            </div>
            <div class="slds-col slds-col_bump-right slds-size_1-of-8">
                <span>v1.1.0</span>
            </div>
            <div class="slds-col slds-size_1-of-8">
                <a href="#" @click="onAboutClick">About</a>
            </div>
        </div>
    </footer>

    <AboutModal ref="aboutModal" />
</template>