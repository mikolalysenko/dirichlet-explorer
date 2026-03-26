<script>
  export let label = '';
  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let format = (v) => v;
</script>

<div class="slider-row">
  <label>{label}</label>
  <input type="range" bind:value {min} {max} {step} />
  <span class="value">{format(value)}</span>
</div>
