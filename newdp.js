const crypto = require("crypto")
const request = require("request")

const url = 'https://dm.aliyuncs.com/'

const urlFromParam = (param) => {
    let keys = Object.keys(param)
    let l = []
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i]
        let v = mapper[k]
        let s = `${encodeURIComponent(k)}&${encodeURIComponent(v)}`
        l.push(s)
    }
    let url = l.sort().join('&')
    return url
}

const reqBodyFromParma = (param) => {
    let r =[]
    let keys = Object.keys(param)
    for (var i = 0; i < keys.length; i++) {
        let key = keys[i]
        let value = parma[key]
        r.push(`${i}=${value}`)
    }
    return r
}

const reqBodyValue = (config, param) => {
    signStr = urlFromParam(param)
    sign = 'POST&%2F&' + encodeURIComponent(signStr)
    let key = config.accessKeySecret + '&'
    const hmac = crypto.createHmac("sha1", key)
    let str = hmac.update(sign).digest('base64')
    let s = encodeURIComponent(str)
    let r = ['Signature=' + s]
    let r1 = reqBodyFromParma(param)
    let rbv = r.concat(r1).join('&')
    return rbv
}


const apiPost = (url, body, callback) => {
    let p = new Promise((resolve, reject) => {
        request({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            uri: url,
            body: body,
            method: 'POST',
        }, function(err, res, body) {
            if (err !== null) {
                reject(err)
            } else {
                resolve(body)
            }
        })
    })
    return p
}

const baseParam = (action, nonce) => {
    let o = {
        AccessKeyId: config.accessKeyID,
        Action: action,
        Format: 'JSON',
        AccountName: config.accountName,
        AddressType: typeof config.addressType == 'undefined' ? 0 : config.addressType,
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: nonce,
        SignatureVersion: '1.0',
        TemplateCode: config.templateCode,
        Timestamp: date.toISOString(),
        Version: '2015-11-23',
    }
    return o
}

const actionSingle = (config) => {
    if (!config.toAddress) {
        errorMsg.push('toAddress required')
    }
    let param = baseParam('single')
    param.ReplyToAddress = Boolean(config.replyToAddress)
    param.ToAddress = config.toAddress
    if (config.fromAlias) {
        param.FromAlias = config.fromAlias
    }
    if (config.subject) {
        param.Subject = config.subject
    }
    if (config.htmlBody) {
        param.HtmlBody = config.htmlBody
    }
    if (config.textBody) {
        param.TextBody = config.textBody
    }
    return param

}

const actionBatch = (config) => {
    if (!config.templateName) {
        errorMsg.push('templateName required')
    }
    if (!config.receiversName) {
        errorMsg.push('receiversName required')
    }
    let param = baseParam('batch')
    param.TemplateName = config.templateName
    param.ReceiversName = config.receiversName
    if (config.tagName) {
        param.TagName = config.tagName
    }
    return param
}

module.exports = function(config, cb) {
    const nonce = Date.now()
    const date = new Date()
    const errorMsg = []
    config = config || {}
    if (!config.accessKeyID) {
        errorMsg.push('accessKeyID required')
    }
    if (!config.accessKeySecret) {
        errorMsg.push('accessKeySecret required')
    }
    if (!config.accountName) {
        errorMsg.push('accountName required')
    }
    let actionMapper = {
        'single': actionSingle,
        'batch': actionBatch,
    }
    let param = {}
    if (Object.keys(actionMapper).includes(config.action)) {
        let func = actionMapper[config.action]
        param = func()
    } else {
        cb('error action', null)
    }
    if (errorMsg.length > 0) {
        return cb(errorMsg.join(','))
    }
    let body = reqBodyValue(config, param)
    const url = 'https://dm.aliyuncs.com/'
    apiPost(url, body).then((data) => {
        cb(data)
    })
}