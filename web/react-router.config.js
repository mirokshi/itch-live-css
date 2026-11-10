// React Router in framework mode, as a static site: every route is prerendered at build time
// (ssr: false + prerender), so pages still work without JavaScript. Output: build/client.
export default {
  appDirectory: 'src',
  ssr: false,
  prerender: ({ getStaticPaths }) => getStaticPaths(),
};
