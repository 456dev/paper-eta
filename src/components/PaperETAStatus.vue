<script setup lang="ts">
import { ref } from 'vue';

const { version } = defineProps<{ version: string }>()

const etaMsg = ref('fetching eta from PaperMC...')
const etaStatus = ref('loading')

fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}/eta`)
    .then(async (response) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!response.ok) {
            throw new Error("No ETA")
        }
        etaMsg.value = await response.text()
        etaStatus.value = "found"
    }).catch((e) => {
        etaMsg.value = 'No ETA available for this version.'
        etaStatus.value = "not_found"
    })

</script>

<template>
<p :data-eta-status="etaStatus">{{ etaMsg }}</p>
</template>