$(function () {
  $('.time li').on('click', function () {
    $('.time li').removeClass('active');
    $(this).addClass('active');
  });
});
