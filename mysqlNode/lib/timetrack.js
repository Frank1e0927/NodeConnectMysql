const qs = require('querystring');

//  把html结构返回给客户端，以buffer流字节的形式。
exports.sendHtml = (res, html) => {
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(html)
}

//  解析接受到 客户端 http POST的数据
exports.parseReceivedData = (req, cb) => {
  let body = ''
  req.setEncoding('utf8')
  req.on('data', (chunk) => {
    body += chunk
  })
  req.on('end', () =>{
    let data = qs.parse(body)
    cb(data)
  })
}

exports.actionForm = (id, path, label) => {
  let html = '<form method="POST" action="' + path + '">' +
  '<input type="hidden" name="id" value="' + id + '">' +
  '<input type="submit" value="' + label + '">' +
  '</form>'
  return html
}


//  添加工作记录
exports.add = (db, req, res) => {
  exports.parseReceivedData(req, work => {
    db.query(
      //  mysql数据库插入操作
      " INSERT INTO work (hours, date, description) " +
      " VALUE (?, ?, ?)",
      [work.hours, work.date, work.description],
      err => {
        if (err) { throw err }
        exports.show(db ,res)
      }
    )
  })
}

//  删除工作记录
exports.delete = (db, req, res) => {
  exports.parseReceivedData(req, work => {
    db.query(
      "delete from work where id=?",
      [work.id],
      err => {
        if (err) {
          throw err
        }
        exports.show(db ,res)
      }
    )
  })
}

//  更新mysql数据逻辑，更新一条工作记录
exports.archive = (db, req, res) => {
  exports.parseReceivedData(req, work => {
    db.query(
      //  mysql数据库更新操作
      "UPDATE work SET archived=1 WHERE id=?",
      [work.id],
      err => {
        if (err) {
          throw err
        }
        exports.show(db, res)
      }
    )
  })
}

//  获取mysql数据库中工作记录
exports.show = (db, res, showArchived) => {
  let query = 'select * from work where archived=? order by date desc'
  let archiveValue = showArchived ? 1 : 0
  db.query(
    query,
    [archiveValue],
    (err, results, fields) => {
      if (err) {
        throw err
      }
      let html = showArchived ? ''
      : '<a href="/archived">已完成的工作记录</a><br/>';
      html += exports.workHitlistHtml(results);
      html += exports.workFormHtml();
      exports.sendHtml(res, html)
    }
  )
}

//  仅显示归档工作记录
exports.showArchived = (db, res) => {
  exports.show(db, res, true)
}

//  渲染HTML表格
exports.workHitlistHtml = (results) => {
  let html ='<table>';
  for( let i in results ) {
    html += '<tr>';
    html += '<td>' + results[i].date + '</td>';
    html += '<td>' + results[i].hours + '</td>';
    html += '<td>' + results[i].description + '</td>';
    if (!results[i].archived) {
      html += '<td>' + exports.workArchiveForm(results[i].id) + '</td>'
    }
    html += '<td>' + exports.workDeleteForm(results[i].id) + '</td>'
    html += '</tr>'
  }
  html += "</table>"
  return html
}

exports.workFormHtml = () => {
  let html = '<form method="POST" action="/">' +
    '<p>日期 (YYYY-MM-DD):<br/><input name="date" type="text"></p>' +
    '<p>工时：<br/><input name="hours" type="text"></p>' +
    '<p>描述：<br/>' +
    '<textarea name="description"></textarea></p>' +
    '<input type="submit" value="Add" />'+
    '</from>';
  return html;
}

exports.workArchiveForm = (id) => {
  return exports.actionForm(id, '/archive', 'Archive')
}

exports.workDeleteForm = (id) => {
  return exports.actionForm(id, '/delete', 'Delete')
}