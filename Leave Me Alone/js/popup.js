const rightUrl = [
  'https://www.linkedin.com/mynetwork/invitation-manager',
  'https://www.linkedin.com/mynetwork/invite-connect/connections'
];
var store = chrome.storage.local;

String.prototype.replaceWithRegex = function() {
  return this
    .replace('(e)', 'e?')
    .replace('(s)', 's?')
}


String.prototype.replaceWithParenthesis = function() {
  return this
    .replace('e?', '(e)')
    .replace('s?', '(s)')
}


const chooseContent = () => {
  chrome.tabs.query({currentWindow: true, active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
    let rightPageBoolean = rightUrl.indexOf(url) !== -1;
    let contentForPending = document.querySelector('.right-page.pending-invitation');
    let contentForExisting = document.querySelector('.right-page.existing-connection');
    let contentForWrong = document.querySelector('.wrong-page');

    if (url.includes('https://www.linkedin.com/mynetwork/invitation-manager')) {
      contentForExisting.style = "display:none";
      contentForWrong.style = 'display:none';
    } else if (url.includes('https://www.linkedin.com/mynetwork/invite-connect/connections')) {
      contentForPending.style = "display:none";
      contentForWrong.style = 'display:none';
    } else {
      contentForPending.style = "display:none";
      contentForExisting.style = "display:none";
    }
  });
}


const openOnClick = (element, newURL) => {
  element.addEventListener('click', activeTab => {
    chrome.tabs.create({ url: newURL });
  });
};


const sendMessageToPending = () => {
  chrome.tabs.query({currentWindow: true, active: true, lastFocusedWindow: true}, tabs => {
    let activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {action: "start-cleaning-pending"});
    // window.close();
  });
};


const sendMessageToExisting = () => {
  chrome.tabs.query({currentWindow: true, active: true, lastFocusedWindow: true}, tabs => {
    let activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {action: "start-cleaning-existing"});
    // window.close();
  });
};



const openExtensionPageOnClick = (element, page) => {
  let extensionId = chrome.runtime.id;
  let url = `chrome-extension://${extensionId}/html/${page}.html`
  openOnClick(element, url)
}


const addEvents = () => {
  let cometLogo = document.getElementById('logo-comet');
  openOnClick(cometLogo, 'https://hellocomet.co/');

  let linkLinkedIn = document.querySelector('span#linkedIn');
  openOnClick(linkLinkedIn, rightUrl[0]);

  let linkLinkedIn2 = document.querySelector('span#linkedIn2');
  openOnClick(linkLinkedIn2, rightUrl[1]);

  let startButtonPending = document.querySelector('#start-pending');
  startButtonPending.addEventListener('click', sendMessageToPending);

  let startButtonExisting = document.querySelector('#start-existing');
  startButtonExisting.addEventListener('click', sendMessageToExisting);

  let setting = document.querySelector('#settings');
  openExtensionPageOnClick(setting, 'options');

  let help = document.querySelector('#help');
  openExtensionPageOnClick(help, 'help')
}


const checkTargetedHeadline = () => {
  store.get('targetedHeadline', data => {
    if (!data.targetedHeadline) {
      let defaultHeadlines = [
        'chargé(e) de recherche',
        'chargé(e) de recrutement',
        'chargé(e) de RH',
        'assistant RH',
        'responsable RH',
        'ingénieur(e) commercial',
        "ingénieur(e) d'affaire",
        'responsable commercial',
        'directeur commercial',
        'responsable de comptes',
        'sourcing officer',
        'recruiter',
        'HR officer',
        'HR assistant',
        'head of HR',
        'sales',
        'head of sales',
        'account manager'
      ];
      let data = defaultHeadlines.map(headline => {
        return {
          name: headline.replaceWithRegex(),
          active: true
        }
      })
      store.set({targetedHeadline: data})
    }
  })
}


const main = () => {
  checkTargetedHeadline();
  chooseContent();
  addEvents();
}


main();
