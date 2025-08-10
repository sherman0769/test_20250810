// 攔截表單提交，改以非同步方式上傳檔案，並提供提示訊息。
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.upload-form');
  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const action = form.getAttribute('action');
      fetch(action, {
        method: 'POST',
        body: formData,
      })
        .then((resp) => resp.text())
        .then((msg) => {
          // 透過 alert 告知使用者結果
          alert(msg);
        })
        .catch((err) => {
          alert('上傳失敗：' + err.message);
        });
    });
  });
});