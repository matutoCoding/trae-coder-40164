export default defineAppConfig({
  pages: [
    'pages/record/index',
    'pages/member/index',
    'pages/notes/index',
    'pages/recordDetail/index',
    'pages/noteDetail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F7F8FA',
    navigationBarTitleText: '声纹纪要',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#0D9488',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/record/index',
        text: '录音',
      },
      {
        pagePath: 'pages/member/index',
        text: '成员',
      },
      {
        pagePath: 'pages/notes/index',
        text: '笔记',
      },
    ],
  },
});
