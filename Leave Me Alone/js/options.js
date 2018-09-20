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


const checkTargetedHeadline = () => {
  store.get('targetedHeadline', data => {
    if (!data.targetedHeadline) {
      let defaultHeadlines = [
        'sourcing officer',
        'recruiter',
        'consultant',
        'hunter',
        'head',
        'HR officer',
        'HR assistant',
        'head of HR',
        'account manager',
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


const addHeadline = (name, value) => {
  let ul = document.querySelector('ul#headlineList');
  
  let li = document.createElement('li');
  li.className = 'li-row';
  let input = document.createElement('input')
  input.type = "checkbox";
  input.checked = value;
  li.appendChild(input)
  let p = document.createElement('p');
  p.innerText = name.replaceWithParenthesis();
  p.className = 'headlineName'
  li.appendChild(p);

  ul.appendChild(li);
};


const displayTargetedHeadline = () => {
  let ul = document.querySelector('ul#headlineList');
  ul.innerHTML = "";  
  store.get('targetedHeadline', data => {
    let headlines = data.targetedHeadline;
    headlines.map(headline => addHeadline(headline.name, headline.active));
  })
};


const addTargetedHeadline = (nameHeadline) => {
  store.get('targetedHeadline', data => {
    if (data.targetedHeadline) {
      nameHeadline = nameHeadline.replaceWithParenthesis();
      let newHeadline = {name: nameHeadline, active: true};
      data.targetedHeadline.push(newHeadline);
      store.set({targetedHeadline: data.targetedHeadline}, displayTargetedHeadline)
    }
  })
};


const addEvents = () => {
  // Adds event on the input element to add a new headline (when ENTER
  // is pressed, save the content of the input in storage)
  let input = document.querySelector('input#nameHeadline');
  input.addEventListener('keypress', e => {
    if (e.which === 13 || e.charCode === 13) {
      let nameHeadline = document.querySelector('input#nameHeadline').value;
      addTargetedHeadline(nameHeadline)
    }
  });

  // Adds event on the "Add headline" button
  let adder = document.querySelector('button#addHeadline');
  adder.addEventListener('click', () => {
    let nameHeadline = document.querySelector('input#nameHeadline').value;
    addTargetedHeadline(nameHeadline)
  });
  
  // Adds events on the modal (close, ...)
  let modal = document.querySelector('.modal');
  let span = document.querySelector('span.close-modal');
  span.onclick = () => {
    modal.style.display = "none";
  }
  
  window.onclick = event => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  let cancelButton = document.querySelector('.modal #modal-cancel');
  cancelButton.onclick = function() {
    document.querySelector('.modal').style.display = 'none';
  }
  
  let confirmButton = document.querySelector('.modal #modal-confirm');
  confirmButton.onclick = () => {
    let lis = document.querySelectorAll('ul#headlineList li');
    lis = Array.from(lis);
    lis = lis.map(li => {
      return {
        name: li.querySelector('p').textContent.replaceWithRegex(),
        active: !li.querySelector('input').checked
      }
    });
    lis = lis.filter(li => li.active);
    store.set({'targetedHeadline': lis}, () => {
      displayTargetedHeadline();  
      let modal = document.querySelector('.modal');
      modal.style.display = 'none';
    });
  }

  // Adds event on the "Delete Headline" button
  let deleteButton = document.querySelector('#delete');
  deleteButton.onclick = () => {
    modal.style.display = 'block';
    let lis = document.querySelectorAll('ul#headlineList li');
    lis = Array.from(lis);
    let str = lis.map(li => {
      return li.querySelector('input').checked ?
        li.querySelector('p').textContent :
        undefined
    })
    str = str.filter(element => element);
    str = str.reduce((pv, cv) => pv + cv + ', ' , '');
    str = str.substring(0, str.length - 2);
    let toFill = document.querySelector('#headline-delete');
    toFill.textContent = str;
  }
  
  // Adds events on the "Save Modifications" button
  let saver = document.querySelector('button#update');
  saver.addEventListener('click', () => {
    let lis = document.querySelectorAll('ul#headlineList li');
    window.console.log(lis);
    let data = Array.from(lis).map(li => {
      return {
        name: li.querySelector('p').innerText,
        active: li.querySelector('input').checked,
      }
    });
    store.set({targetedHeadline: data}, () => {
      saver.className = 'validated'
      saver.textContent = 'Modifications enregistrées';
      setTimeout(() => {
        saver.className = 'green'
        saver.textContent = 'Save Modifications';
      }, 2000);
    })
    window.console.log(data);
  });

  // Adds events on the checkbox selector
  let selectors = document.querySelectorAll('.selector');
  selectors = Array.from(selectors);
  selectors.map(selector => selector.onclick = function() {
    let lis = document.querySelectorAll('ul#headlineList li input');
    let select = this.id === 'select-all';
    Array.from(lis).map(li => li.checked = select);
  })
};


const main = () => {
  checkTargetedHeadline();
  displayTargetedHeadline();
  addEvents();
};


main();
