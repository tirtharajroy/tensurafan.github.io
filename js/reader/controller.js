app.initReader = async function(volumes, routerInstance, namePickerInstance, terms, globalTermchoices, presistantConfigs){
	let template = await fetch("/js/reader/view.html").then(owo=>owo.text())

	let view = proxymity(template, {
		errored: false,
		errorMessage: "",
		showFootnote,
	})

	let readerContainer = view.find(el=>el.id === "reading-content")

	routerInstance.add("/read/*", view)

	let subableEvents = ["scroll", "touchend", "touchcancle", "mouseup", "blur"]

	routerInstance.on.set(view, async function(){
		let pathMatch = /^\/read\/([^\/]+)(\/quote\/([^\/]+))?$/.exec(routerInstance.path)

		let volumeId = view.app.volumeId = pathMatch[1]
		let quotedLine = parseInt(pathMatch[3])

		let volume = volumes.find(volume=>volume.id === volumeId)
		if (!volume){
			view.app.errored = true
			view.app.errorMessage = "The volume you have requested doesn't exist UwU"
			return
		}

		try{
			view.app.errored = false
			view.app.errorMessage = ""
			let content = await fetch(volume.path).then(owo=>owo.text())

			// let quotedParagraph = null
			// let imagesPromise = []
			// content.map(generateParagraph)
			// 	.forEach(function(paragraph, index){
			// 		if (!paragraph){
			// 			return
			// 		}
			//
			// 		if (paragraph.imagesPromise){
			// 			imagesPromise.push(paragraph.imagesPromise)
			// 		}
			//
			// 		fragment.appendChild(paragraph)
			// 		if (index === quotedLine){
			// 			paragraph.classList.add("color-primary", "underline", "color-in")
			// 			quotedParagraph = paragraph
			// 		}
			// 		paragraph.id = ("line_" + index)
			// 		paragraph.classList.add("line")
			// 	})

			proxymity(content, view.app).appendTo(readerContainer)

			// await Promise.all(imagesPromise).then(RAFP)

			if (quotedLine){
				let quotedParagraph = document.getElementById("line_" + quotedLine)
				quotedParagraph.classList.add("color-primary", "color-in")
				quotedParagraph.scrollIntoView({
					// behavior: "smooth",
					block: "center"
				})

			}
			else if (presistantConfigs.topLine && presistantConfigs.topLine[volumeId]){
				let line = document.getElementById("line_" + presistantConfigs.topLine[volumeId])
				line.scrollIntoView({block: "start"})
			}

			subableEvents.forEach(eventName=>{
				window.addEventListener(eventName, onUserInteractWithPage)
			})
		}
		catch(uwu){
			view.app.errored = true
			view.app.errorMessage = "Oops something went wrong UwU"
			console.warn(uwu)
		}
	})

	routerInstance.on.unset(view, async function(){
		while(readerContainer.lastChild){
			readerContainer.removeChild(readerContainer.lastChild)
		}
		subableEvents.forEach(eventName=>{
			window.removeEventListener(eventName, onUserInteractWithPage)
		})
	})

	// --- alright here's the foot note stuff

	let footnoteTemplate = await fetch("/js/reader/footnote.html").then(owo=>owo.text())

	let footnoteView = proxymity(footnoteTemplate, {
		text: "",
		parent: null,
		bottom: 0
	})

	proxymity.watch(footnoteView.app, "parent", function(newParent){
		if (!newParent){
			return footnoteView.detach()
		}

		footnoteView.appendTo(readerContainer)

		footnoteView.app.bottom = newParent.offsetTop + newParent.offsetHeight
	})

	// document.addEventListener("click", onUserInteractWithPage)

	// ok we need to set up some stuff to do with the term selector
	let termsToCheck = Object.keys(terms)

	return template

	function showFootnote(element, footnote, event){
		event.stopPropagation()
		let changed = false

		if (footnoteView.app.text !== footnote){
			footnoteView.app.text = footnote
			changed = true
		}

		if (footnoteView.app.parent !== element){
			footnoteView.app.parent = element
			changed = true
		}

		if (!changed){
			hideFootnote()
		}
	}

	function hideFootnote(){
		footnoteView.app.parent = null
		footnoteView.app.bottom = 0
	}

	function selectNameEventHandler(ev){
		let elementModel = ev.target.app
		if (!elementModel){
			return
		}

		namePickerInstance.app.baseName = elementModel.displayedTerm
		namePickerInstance.app.chosenName = globalTermchoices[elementModel.displayedTerm]
		namePickerInstance.app.setNameOptions(terms[elementModel.displayedTerm])
		namePickerInstance.app.display = true
	}

	var navBarEl
	function onUserInteractWithPage(){
		hideFootnote()
		!navBarEl && (navBarEl = document.getElementById("nav"))
		let navBarBox = navBarEl.getBoundingClientRect()

		let overlappings = document.elementFromPoint(navBarBox.width/2, navBarBox.bottom + 1)

		presistantConfigs.topLine = presistantConfigs.topLine || {}

		presistantConfigs.topLine[view.app.volumeId] = parseInt(overlappings.id.replace("line_", ""))

		app.saveSettings()
	}

	function RAFP(){
		return new Promise(function(accept){
			requestAnimationFrame(accept)
		})
	}
}
