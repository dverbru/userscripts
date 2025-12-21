// ==UserScript==
// @name         Jira Rich Link Copy
// @namespace    https://github.com/dverbru/userscripts
// @version      1.0.0
// @description  Enhances Jira's issue permalink copy button to yield HTML links including the issue title.
// @author       Diego Verbrugghe
// @match        https://*.atlassian.net/browse/*
// @match        https://*.atlassian.net/issues*
// @match        https://*.atlassian.net/jira/*
// @icon         https://jira.atlassian.com/favicon.ico
// @grant        GM.setClipboard
// @run-at       document-idle
// @homepage     https://github.com/dverbru/userscripts
// @homepageURL  https://github.com/dverbru/userscripts
// @downloadURL  https://github.com/dverbru/userscripts/raw/main/src/scripts/jira/jira-rich-link-copy.user.js
// @updateURL    https://github.com/dverbru/userscripts/raw/main/src/scripts/jira/jira-rich-link-copy.user.js
// ==/UserScript==

;(function () {
  'use strict'

  const SCRIPT_NAME = 'Jira Rich Link Copy'
  const HTML_LINK_TEMPLATE =
    '<a href="{{issueUrl}}">{{issueId}}—{{issueName}}</a>'
  const PLAINTEXT_LINK_TEMPLATE = '{{issueUrl}} ({{issueName}})'

  const writeLinkToClipboard = async (
    /** @type {string} */ html,
    /** @type {string} */ plaintext,
  ) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plaintext], { type: 'text/plain' }),
        }),
      ])
    } catch (error) {
      console.warn(
        `[${SCRIPT_NAME}] Native Clipboard API write failed, falling back to GM.setClipboard…`,
        error,
      )

      let typeParam
      switch (GM.info.scriptHandler) {
        case 'Tampermonkey':
          typeParam = 'html'
          break
        case 'Violentmonkey':
        case 'Userscripts':
          typeParam = 'text/html'
          break
        case 'Greasemonkey':
        default:
          typeParam = undefined
      }
      if (typeParam) await GM.setClipboard(html, typeParam)
      else await GM.setClipboard(plaintext)
    }
    console.info(`[${SCRIPT_NAME}] Copied link to clipboard.`)
  }

  const applyTemplate = (
    /** @type {string} */ template,
    /** @type {string} */ issueId,
    /** @type {string} */ issueName,
    /** @type {string} */ issueUrl,
  ) => {
    return template
      .replaceAll('{{issueId}}', issueId)
      .replaceAll('{{issueName}}', issueName)
      .replaceAll('{{issueUrl}}', issueUrl)
  }

  const handleCopyToClipboard = (/** @type {Event} */ event) => {
    /** @type {HTMLAnchorElement | null} */
    const issueBreadcrumb = document.querySelector(
      'a[data-testid*=current-issue]',
    )
    /** @type {HTMLHeadingElement | null} */
    const issueSummary = document.querySelector(
      'h1[data-testid*="summary.heading"]',
    )

    if (!issueBreadcrumb || !issueSummary) {
      console.warn(`[${SCRIPT_NAME}] Expected elements not found.`)
      return
    }

    const issueId = issueBreadcrumb.textContent
    const issueName = issueSummary.textContent
    const issueUrl = issueBreadcrumb.href

    const linkHTML = applyTemplate(
      HTML_LINK_TEMPLATE,
      issueId,
      issueName,
      issueUrl,
    )
    const linkText = applyTemplate(
      PLAINTEXT_LINK_TEMPLATE,
      issueId,
      issueName,
      issueUrl,
    )

    event.stopPropagation() // crucial
    writeLinkToClipboard(linkHTML, linkText).catch(
      (/** @type {unknown} */ error) => {
        console.error(
          `[${SCRIPT_NAME}] Error when copying to clipboard:`,
          error,
        )
      },
    )
  }

  const attachPermalinkButtonClickListener = (
    /** @type {Element} */ copyButton,
  ) => {
    copyButton.removeEventListener('click', handleCopyToClipboard)
    copyButton.addEventListener('click', handleCopyToClipboard)
  }

  const findAndImprovePermalinkButtons = () => {
    const isIssueReady = document.querySelector('[data-testid*=issue-details]')
    if (!isIssueReady) return

    const copyButton = document.querySelector(
      '[data-testid*=permalink-button] button',
    )
    if (copyButton) {
      attachPermalinkButtonClickListener(copyButton)
    }
  }

  console.info(`[${SCRIPT_NAME}] Initializing…`)

  // First time, in case the elements already exist
  findAndImprovePermalinkButtons()

  // Then observe for future changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        findAndImprovePermalinkButtons()
      }
    }
  })
  observer.observe(document, { childList: true, subtree: true })
})()
