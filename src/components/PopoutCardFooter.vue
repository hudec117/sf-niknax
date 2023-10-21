<script setup lang="ts">
import { ref } from 'vue';

import LicensesModal from './modals/licenses/LicensesModal.vue';

const licensesModal = ref<InstanceType<typeof LicensesModal> | null>(null);

function onLicensesClick() {
    licensesModal.value?.show();
}
</script>

<template>
    <footer class="slds-card__footer slds-p-vertical_x-small">
        <div class="slds-grid">
            <div class="slds-col">
                <span class="slds-float_left">Made with &#10084;&#65039; on <a href="https://github.com/hudec117/sf-niknax" class="external-link" target="_blank">GitHub</a></span>
            </div>
            <div class="slds-col slds-col_bump-right slds-size_1-of-8">
                <span>v0.4.0</span>
            </div>
            <div class="slds-col slds-size_1-of-8">
                <a href="#" @click="onLicensesClick">Licenses</a>
            </div>
        </div>
    </footer>

    <LicensesModal ref="licensesModal" />
</template>