<script>
  import TableOfContents from './components/layout/TableOfContents.svelte';
  import S0_Hero from './sections/S0_Hero.svelte';
  import S1_Primes from './sections/S1_Primes.svelte';
  import S2_Progressions from './sections/S2_Progressions.svelte';
  import S3_ModArithmetic from './sections/S3_ModArithmetic.svelte';
  import S4_Characters from './sections/S4_Characters.svelte';
  import S5_LFunctions from './sections/S5_LFunctions.svelte';
  import S6_NonVanishing from './sections/S6_NonVanishing.svelte';
  import S7_FullPicture from './sections/S7_FullPicture.svelte';

  const sections = [
    { id: 'hero', title: 'Introduction', number: '0' },
    { id: 'primes', title: 'Primes', number: '1' },
    { id: 'progressions', title: 'Arithmetic Progressions', number: '2' },
    { id: 'modular', title: 'Modular Arithmetic', number: '3' },
    { id: 'characters', title: 'Dirichlet Characters', number: '4' },
    { id: 'lfunctions', title: 'L-Functions', number: '5' },
    { id: 'nonvanishing', title: 'Non-Vanishing', number: '6' },
    { id: 'conclusion', title: 'The Full Picture', number: '7' },
  ];
</script>

<TableOfContents {sections} />

<main>
  <div id="hero">
    <S0_Hero />
  </div>
  <S1_Primes />
  <S2_Progressions />
  <S3_ModArithmetic />
  <S4_Characters />
  <S5_LFunctions />
  <S6_NonVanishing />
  <S7_FullPicture />

  <footer>
    <p>An explorable explanation of Dirichlet's Theorem on Primes in Arithmetic Progressions.</p>
    <p>Built with Svelte, KaTeX, and curiosity.</p>
  </footer>
</main>

<style>
  main {
    margin-left: var(--sidebar-width);
    min-height: 100vh;
  }

  footer {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 3em 1.5em;
    text-align: center;
    color: var(--color-text-light);
    font-size: 0.85rem;
    border-top: 1px solid var(--color-border-light);
  }

  footer p {
    margin-bottom: 0.3em;
  }

  @media (max-width: 900px) {
    main {
      margin-left: 0;
    }
  }
</style>
