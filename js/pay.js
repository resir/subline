var payManager = {
    queryHandler: 0,
    payApi: null,
    init: function () {
        if (null == qrcode) {
            $('payLoading').style.display = 'block';
            $$('.codeBody')[0].style.display = 'none';
            $('tip').style.display = 'none';
            payManager.checkQrcode();
            payManager.queryHandler = setInterval(payManager.checkQrcode, 1000);
            this.percent = 0;
            payManager.percentHandler = setInterval(payManager.displayPercent, 100);
        } else {
            if (method == 'alipay') {
                $('openAlipay').href = qrcode;
                if (document.body.clientWidth < 678) {
                    location.href = qrcode;
                }
            }
            payManager.qrcode(qrcode);
        }
        payManager.payTimeTick();
        payManager.payTimeTickHandler = setInterval(payManager.payTimeTick, 1000);
    },
    displayPercent: function () {
        if (typeof this.percent == 'undefined') {
            this.percent = 0;
        }
        if (this.percent < 99) {
            this.percent++;
        }
        $("qrCodePercent").innerHTML = this.percent + "%";
    },
    checkQrcode: function () {
        if (mask) {
            url = '?act=getQrcode&id=' + orderId;
        } else {
            url = '/pay/getQrcode/' + orderId;
        }

        new Request.JSON({
            url: url,
            onSuccess: function (e) {
                if (e.error) {
                } else {
                    if (e.data.percent >= 100) {
                        clearInterval(payManager.queryHandler);
                        qrcode = e.data.qrcode;
                        if (method == 'alipay') {
                            $('openAlipay').href = qrcode;
                            if (document.body.clientWidth < 678) {
                                location.href = qrcode;
                            }
                        }
                        payManager.qrcode(qrcode);

                        $('payLoading').style.display = 'none';
                        $$('.codeBody')[0].style.display = 'block';
                        $('tip').style.display = 'block';
                    } else {
                        if (e.data.percent > 0) {
                            this.percent = e.data.percent;
                        }
                    }
                }
            }.bind(this)
        }).send();
    },
    qrcode: function (qrcode) {
        qrCode("qrcodeCanvas", qrcode, 160);
        var canvas = document.getElementsByTagName("canvas")[0];
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        $('qrcodeCanvas').innerHTML = '';
        $('qrcodeCanvas').appendChild(image);

        if (isWechat()) {
            $("wxNotice").innerHTML = "请长按下方二维码，<br/>在弹出菜单选择“识别图中二维码”进行支付";
        }
    },
    payTimeTick: function () {
        payTimeExpiry--;
        var minute = parseInt(payTimeExpiry / 60);
        var sec = payTimeExpiry % 60;
        if (payTimeExpiry > 0) {
            $("minute_show").innerHTML = minute;
            $("second_show").innerHTML = sec;
        } else {
            clearInterval(payManager.payTimeTickHandler);
            $('qrcodeCanvas').style.display = "none";
            $$(".stop")[0].style.display = "block";
            $('tip').style.display = 'none';
            $('paypage-order').style.display = 'none';
            if (method == 'alipay') {
                $('openAlipay').style.display = 'none';
            }
        }
        if (null != qrcode && '' != qrcode) {
            if (mask) {
                url = '?act=status&id=' + orderId;
            } else {
                url = '/order/status/' + orderId;
            }
            new Request.JSON({
                url: url,
                headers: {
                    "X-CSRFToken": Cookie.read("csrfToken")
                },
                onSuccess: function (e) {
                    if (e.error) {
                    } else {
                        if (e.data == 1) {
                            clearInterval(payManager.payTimeTickHandler);
                            if (mask) {
                                location.href = '?act=success&id=' + orderId;
                            } else {
                                location.href = "/pay/order/" + orderId + "/success";
                            }

                        } else if (e.data == 2) {
                            clearInterval(payManager.payTimeTickHandler);
                        }
                    }
                }.bind(this)
            }).send();
        }
    }
};

function isWechat() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == "micromessenger") {
        return true;
    } else {
        return false;
    }
}

window.addEvent('domready', function () {
    payManager.init();
});