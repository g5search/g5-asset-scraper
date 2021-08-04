module.exports = {
  init,
  getEmails
}

function init (Scraper) {
  Scraper.addProp('emails', {}, true)
  Scraper.addProp('emailRegex', /([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)/gm, false)
  Scraper.addScraper('afterPageChange', getEmails)
}

function getEmails(scraper) {
  if (!scraper.emails.email) scraper.emails.email = {}
  const emails = scraper.$(scraper.template.email.selector ? scraper.template.email.selector : 'body').html()
  const matched = emails.match(scraper.emailRegex)
  if (matched) {
    matched.forEach((e) => {
      const email = e.toLowerCase()
      if (!scraper.emails[email]) {
        scraper.emails.email[email] = { count: 0 }
      }
      scraper.emails.email[email].count++
    })
  }
}