const crypto = require("crypto")
const axios = require('axios')

const url = "https://dm.aliyuncs.com/"

const urlFromParam = (param) => {
    let keys = Object.keys(param)
    let l = []
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i]
        let v = param[k]
        let s = `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
        l.push(s)
    }
    let url = l.sort().join("&")
    return url
}

const reqBodyFromParma = (param) => {
    let r =[]
    let keys = Object.keys(param)
    for (var i = 0; i < keys.length; i++) {
        let key = keys[i]
        let value = param[key]
        r.push(`${key}=${value}`)
    }
    return r
}

const reqBodyValue = (config, param) => {
    let signStr = urlFromParam(param)
    let sign = "POST&%2F&" + encodeURIComponent(signStr)
    let key = config.AccessKeySecret + "&"
    let hmac = crypto.createHmac("sha1", key)
    let str = hmac.update(sign).digest("base64")
    let s = encodeURIComponent(str)
    let reqBody = ["Signature=" + s]
    let r1 = reqBodyFromParma(param)
    let url = reqBody.concat(r1).join("&")
    return url
}

const baseParam = (action, config) => {
    let o = {
        AccessKeyId: config.AccessKeyID,
        Action: action,
        Format: "JSON",
        AccountName: config.AccountName,
        AddressType: typeof config.AddressType == "undefined" ? 0 : config.AddressType,
        SignatureMethod: "HMAC-SHA1",
        SignatureNonce: Date.now(),
        SignatureVersion: "1.0",
        TemplateCode: config.TemplateCode,
        Timestamp: new Date().toISOString(),
        Version: "2015-11-23",
    }
    return o
}

const actionSingle = (config, errorMsg) => {
    if (!config.ToAddress) {
        errorMsg.push("toAddress required")
    }
    let param = baseParam("SingleSendMail", config)
    param.ReplyToAddress = Boolean(config.replyToAddress)
    param.ToAddress = config.ToAddress
    if (config.FromAlias) {
        param.FromAlias = config.FromAlias
    }
    if (config.Subject) {
        param.Subject = config.Subject
    }
    if (config.HtmlBody) {
        param.HtmlBody = config.HtmlBody
    }
    if (config.TextBody) {
        param.TextBody = config.TextBody
    }
    return param
}

const actionBatch = (config, errorMsg) => {
    if (!config.TemplateName) {
        errorMsg.push("templateName required")
    }
    if (!config.ReceiversName) {
        errorMsg.push("receiversName required")
    }
    let param = baseParam("BatchSendMail", config)
    param.TemplateName = config.TemplateName
    param.ReceiversName = config.ReceiversName
    if (config.TagName) {
        param.TagName = config.TagName
    }
    return param
}

const apiPost = (url, body,  errorMsg) => {
    let p = new Promise((resolve, reject) => {
        if (errorMsg.length) {
            reject(errorMsg.join(','))
        }
        let request = axios({
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: url,
            data: body
        })
        request
            .then(resolve)
            .catch(reject)

    })
    return p
}

module.exports = function(config) {
    let errorMsg = []
    config = config || {}
    let param = {}
    if (!config.AccessKeyID) {
        errorMsg.push("accessKeyID required")
    }
    if (!config.AccessKeySecret) {
        errorMsg.push("accessKeySecret required")
    }
    if (!config.AccountName) {
        errorMsg.push("accountName required")
    }
    if (!config.Action) {
        errorMsg.push("Action required")
    }
    let actionMapper = {
        "SingleSendMail": actionSingle,
        "BatchSendMail": actionBatch,
    }
    if (Object.keys(actionMapper).includes(config.Action)) {
        let func = actionMapper[config.Action]
        param = func(config, errorMsg)
    }
    let body = reqBodyValue(config, param)
    return  apiPost(url, body, errorMsg)
}

