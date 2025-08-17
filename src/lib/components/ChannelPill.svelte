<script lang="ts">
  export let channel: string = 'hostaway';
</script>
<span class="text-xs px-2 py-0.5 rounded-full border" class:opacity-80={channel!=='hostaway'}>{channel}</span>
