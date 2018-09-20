var store = chrome.storage.local;


const wait = time => new Promise(resolve => setTimeout(resolve, 1000*time));


function range(start, stop, step) {
  if (typeof stop == 'undefined') {
      stop = start;
      start = 0;
  }

  if (typeof step == 'undefined') {
      step = 1;
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
      return [];
  }

  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
      result.push(i);
  }

  return result;
};


const constructHeadlinesRegex = headlines => {
  headlines = headlines.map(headline => headline.active ? headline.name : null);
  headlines = headlines.filter(element => element);
  headlines = headlines.reduce((acc, currentValue) => acc + currentValue + '|', '');
  headlines = headlines.substring(0, headlines.length - 1);
  let headlinesRegex = new RegExp(headlines, 'ig');
  return headlinesRegex;
};


/** Functions to clean pending invitations */


const launchCleaning = (rightRequest, rightSender) => {
  if (rightRequest && rightSender) {
    let cards = findAllCards();
    store.get(['targetedHeadline'], data => {
      if (data.targetedHeadline) {
        let headlines = data.targetedHeadline;
        let headlinesRegex = constructHeadlinesRegex(headlines);
        let selected = cards.map(card => selectCardOrNot(card, headlinesRegex));
        let sumSelected = selected.reduce((pv, cv) => pv+cv, 0);
        findAndClickButton();
      }
    })
  }
  else {
    window.console.log('No go')
  }
};


const findAllCards = () => {
  let cardSelector = "ul.mn-invitation-list li"
  let cards = document.querySelectorAll(cardSelector);
  return Array.from(cards)
};


const selectCardOrNot = (card, headlines) => {
  let position = card.querySelector('.invitation-card__occupation');
  position = position.innerText;
  let checkBox = card.querySelector('input[type="checkbox"]');
  let checkBool = false;
  if (position.match(headlines) && !checkBox.checked) {
    checkBool = true;
    checkBox.checked = checkBool;
    let evt = document.createEvent("HTMLEvents");
    evt.initEvent('change', true, true);
    checkBox.dispatchEvent(evt);
  }
  return checkBool
};


const findAndClickButton = () => {
  let ignoreButton = document.querySelector('ul.mn-list-toolbar');
  ignoreButton = ignoreButton.querySelector('button[data-control-name="ignore_all"');
  ignoreButton.click();
};


// Functions to clean existing connections


const findAllConnections = () => {
  let connections = document.querySelectorAll('li div.mn-connection-card');
  return Array.from(connections);
}


const extractInfos = connection => {
  let headline = connection.querySelector('.mn-connection-card__occupation');
  headline = headline.innerText;
  let name = connection.querySelector('.mn-connection-card__name');
  name = name.innerText;
  let profileImage = connection.querySelector('div.presence-entity__image');
  profileImage = profileImage.style.backgroundImage.slice(5, -2);
  return { headline, name, profileImage }
}


function deleteConnection (connection) {
  return new Promise(resolve => {

    const handleConnection = modal => {
      try {
        // let cancelButton = modal.querySelector('button[data-control-name=cancel_removed]');
        // console.log(cancelButton);
        // cancelButton.click();
        let confirmButton = modal.querySelector('button[data-control-name=confirm_removed]');
        confirmButton.click();
      } catch (error) {
        console.log('Erreur lors de la suppression du contact', error);
      }
      let modalContainer = document.querySelector('div#li-modal-container');
      modalContainer.unbindArrive('div.modal-content-wrapper', handleConnection);
      resolve(true);
    };

    let trigger = connection.querySelector('button[data-control-name=ellipsis]');
    trigger.click();
    let removeButton = connection.querySelector("button[data-control-name=remove]");

    let options = {
      fireOnAttributesModification: false,
      onceOnly: true,
      existing: false,
    };
    let modalContainer = document.querySelector('div#li-modal-container');
    modalContainer.arrive('div.modal-content-wrapper', options, handleConnection);

    removeButton.click();
  });
}


function removeConnectionOrNot (connection, headlinesRegex) {
  let informations = extractInfos(connection);
  if (!headlinesRegex) {
    return NaN;
  }
  if (informations.headline.match(headlinesRegex)) {
    return connection;
  } else {
    return NaN;
  }
}


const scrollToFindConnections = (currentConnections, scrollTop) =>  {
  return Promise.resolve()
    .then(() => {
      let niterArray = range(window.pageYOffset, scrollTop, window.innerHeight);
      return niterArray.reduce(
        (promise_chain, value, index) =>
          promise_chain
            .then(() => {
              window.scrollTo(0, value);
              return Promise.resolve(value)
            })
            .then(() => wait(2)),
        Promise.resolve()
      );
    })
    .then(() => wait(2))
    .then(() => {
      let connections = findAllConnections();
      if (connections.length == currentConnections) {
        return Promise.reject(connections)
      }
      let position = connections[connections.length - 1].getBoundingClientRect();
      return Promise.resolve({
        'length': connections.length,
        'top': position.top + window.pageYOffset})
    })
    .then(info => scrollToFindConnections(info.length, info.top))
}



const displayModal = (connectionsFiltered, headlinesRegex) => {
  let modal = document.createElement('div');
  modal.className = 'comet-modal';
  modal.style = "position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;background-color:rgb(0,0,0,0.4)"
  let modalContent = document.createElement('div');
  modalContent.className = 'comet-modal-content';

  let modalHeader = document.createElement('div');
  modalHeader.className = 'comet-modal-header';
  modalHeader.innerText = 'Leave Me Alone ▹ Connections to remove';
  let closeSpan = document.createElement('span');
  closeSpan.className = 'comet-close-span'
  closeSpan.innerText = 'x';
  closeSpan.addEventListener('click', () => document.querySelector('.comet-modal').remove())
  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(document.createElement('hr'));
  modalContent.appendChild(modalHeader);

  let spanContent = document.createElement('span');
  spanContent.style = 'font-size:90%'
  spanContent.innerText = 'The following connections will be removed:'
  modalContent.appendChild(spanContent);

  let containerList = document.createElement('div');
  containerList.className = 'comet-container-list';
  let listConnection = document.createElement('ul');
  listConnection.className = 'comet-list';
  connectionsFiltered.map(connection => {
    let infos = extractInfos(connection);
    let headline = infos.headline.length > 50 ? infos.headline.slice(0, 50) + '...' : infos.headline;
    let connectionElement = document.createElement('li');
    connectionElement.style = 'list-style-type:none;margin:10px 0px'
    connectionElement.innerHTML = `
    <div style='display:flex'>
      <div style='width:50px;height:50px;margin-right:20px'>
        <img src=${infos.profileImage} style='width:100%;height:100%;border-radius:50%'>
      </div>
      <div>
        <div>${infos.name}<div>
        <div><span style='color:grey;font-size:80%;overflow-x:scroll'>${headline}</span></div>
      </div>
    </div>
    `
    listConnection.appendChild(connectionElement);
  })
  containerList.appendChild(listConnection);
  modalContent.appendChild(containerList);

  let modalFooter = document.createElement('div');
  modalFooter.className = 'comet-modal-footer';
  let buttonAccept = document.createElement('button');
  buttonAccept.classList = ['comet-button comet-button-dark']
  buttonAccept.innerHTML = 'I Agree';
  buttonAccept.addEventListener('click', () => {
    let actions = connectionsFiltered.reduce(
      (promise_chain, connection) =>
        promise_chain
          .then(() => wait(1))
          .then(() => deleteConnection(connection)),
      Promise.resolve()
    ).then(() => document.querySelector('.comet-modal').remove());
  });
  let buttonDismiss = document.createElement('button');
  buttonDismiss.classList = ['comet-button comet-button-bright']
  buttonDismiss.innerHTML = 'I Disagree';
  buttonDismiss.addEventListener('click', () => {document.querySelector('.comet-modal').remove()});
  modalFooter.appendChild(buttonDismiss);
  modalFooter.appendChild(buttonAccept);
  modalContent.appendChild(modalFooter);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}


const cleanExistingConnections = () => {
  store.get(['targetedHeadline'], data => {
    if (data.targetedHeadline) {
      let headlines = data.targetedHeadline;
      let headlinesRegex = constructHeadlinesRegex(headlines);
      let connectionsDone = 0;
      scrollToFindConnections(0, 0)
        .catch(connections => {
          let connectionsFiltered = connections
            .filter(connection => removeConnectionOrNot(connection, headlinesRegex))
          return Promise.resolve(connectionsFiltered)
        })
        .then(connectionsFiltered => displayModal(connectionsFiltered, headlinesRegex))
        .then(connectionsFiltered => {console.log('connexions filtrées', connectionsFiltered)})
    }
  });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let rightSender = sender.id === chrome.runtime.id;
  let rightRequest = request.action.includes('start-cleaning');
  if (request.action === 'start-cleaning-pending') {
    launchCleaning(rightSender, rightSender);
  }
  if (request.action === 'start-cleaning-existing') {
    cleanExistingConnections();
  }
});
