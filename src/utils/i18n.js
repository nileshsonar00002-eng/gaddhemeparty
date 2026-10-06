// Bilingual Dictionary: Hindi (Default) and English
// /* draft - review with a lawyer */

export const translations = {
  hindi: {
    appNameHindi: 'गड्ढे में पार्टी',
    appNameEnglish: 'Gaddhe Me Party',
    tagline: 'मेरा गड्ढा, मेरी शान',
    heroBadge: 'मुफ़्त • बिना लॉगिन',
    heroTitleHtml: 'Spot It. Report It. <span class="hero-highlight-word font-bold">Fix It.</span>',
    heroDescription: 'सड़कों के गड्ढों को सीधे लाइव मैप पर दर्ज करें और अपने शहर की रैंकिंग देखें। 100% खुली व सुरक्षित नागरिक पहल।',
    navMap: 'नक्शा',
    navLeaderboard: 'लीडरबोर्ड',
    navMission: 'हमारा उद्देश्य',
    navHowItWorks: 'कैसे काम करता है',
    navAbout: 'हमारे बारे में',
    navTerms: 'नियम व शर्तें',
    navPrivacy: 'गोपनीयता नीति',
    switchToLightMode: 'लाइट थीम चालू करें',
    switchToDarkMode: 'डार्क थीम चालू करें',
    themeToggleTooltip: 'थीम बदलें (लाइट / डार्क)',
    exploreMapCta: 'नक्शा देखें',
    totalCounter: 'कुल गड्ढे',
    todayCounter: 'आज के गड्ढे',
    topCity: 'प्रमुख शहर',
    locateMe: 'मेरी लोकेशन',
    locating: 'आपकी लोकेशन खोजी जा रही है...',
    locationFound: 'लोकेशन मिल गई!',
    locationDenied: 'GPS अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में लोकेशन ऑन करें।',
    gpsUnsupported: 'इस डिवाइस पर GPS समर्थित नहीं है।',
    aboutBtnTooltip: 'नागरिक पहल जानकारी',
    reportBtn: 'खराब रास्ता रिपोर्ट करें',
    zoomInTooltip: 'ज़ूम इन (+)',
    zoomOutTooltip: 'ज़ूम आउट (-)',
    fullscreenTooltip: 'फुल स्क्रीन',
    exitFullscreenTooltip: 'फुल स्क्रीन से बाहर निकलें',
    gestureHintMobile: 'मैप को हिलाने के लिए २ उंगलियों का उपयोग करें',
    gestureHintDesktop: 'मैप को ज़ूम करने के लिए Ctrl दबाकर स्क्रॉल करें',
    sheetTitle: 'गड्ढा रिपोर्ट करें',
    sheetSubtitle: 'फोटो लें, GPS लोकेशन अपने आप दर्ज हो जाएगी',
    closeAriaLabel: 'बंद करें',
    step1Title: '१. फ़ोटो',
    step2Title: '२. स्थान',
    step3Title: '३. लैंडमार्क (वैकल्पिक)',
    changePhotoBtn: 'फ़ोटो बदलें',
    tapToPhoto: 'गड्ढे की फोटो अपलोड करें',
    photoSelected: 'फोटो चुनी गई',
    takePhoto: 'कैमरे से फोटो खींचें या चुनें',
    uploadGallery: 'गैलरी से चुनें',
    photoOptNote: 'स्वचालित कंप्रेस्ड और EXIF प्राइवेसी सुरक्षित (< 200 KB)',
    photoCompressing: 'फोटो ऑप्टिमाइज़ हो रही है...',
    photoOptimized: '{size} KB में कंप्रेस हुआ',
    photoError: 'फोटो प्रोसेस करने में समस्या आई',
    photoRequiredAlert: 'गड्ढे की फोटो अपलोड करना अनिवार्य है!',
    photoRequiredBtn: 'पहले गड्ढे की फोटो चुनें',
    photoUnderReviewTitle: 'तस्वीर सत्यापन में है...',
    photoUnderReviewDesc: 'एडमिन द्वारा मंज़ूरी (Approval) मिलने के बाद यह तस्वीर सार्वजनिक मैप पर दिखाई देगी।',
    photoUnderReviewBadge: 'सत्यापन प्रक्रिया चालू',
    photoRejectedTitle: 'तस्वीर अस्वीकृत',
    photoRejectedDesc: 'यह तस्वीर नियमों के अनुसार नहीं थी।',
    gpsLocked: 'GPS लोकेशन लॉक हो गई',
    gpsSearching: 'सटीक GPS खोज रहे हैं...',
    gpsRetry: 'GPS पुनः खोजें',
    gpsAccurateStatus: 'उत्कृष्ट GPS (±{acc}m)',
    gpsModerateStatus: 'मध्यम GPS (±{acc}m)',
    gpsWeakStatus: 'कमज़ोर GPS - मैप पर पिन सेट करें',
    gpsVerifiedPin: 'सत्यापित स्थान',
    reDetectGpsBtn: 'GPS पुनः खोजें',
    adjustOnMapBtn: 'मैप पर सेट करें',
    submitBtnMissingPhoto: 'पहले गड्ढे की फ़ोटो जोड़ें',
    submitBtnMissingLocation: 'मैप पर पिन लगाकर स्थान की पुष्टि करें',
    submitBtnMissingBoth: 'फ़ोटो और स्थान जोड़ें',
    gpsRequiredAlert: 'GPS लोकेशन ज़रूरी है! कृपया GPS की अनुमति दें।',
    dragPinHelper: 'पिन को सड़क पर उसी जगह ड्रैग करें या मैप पर टैप करें जहाँ गड्ढा है।',
    weakGpsWarning: 'GPS सिग्नल कमज़ोर है। कृपया मैप पर पिन सही स्थान पर रखें।',
    maxRadiusExceededAlert: 'आप अपने वास्तविक GPS स्थान से 20km से अधिक दूर पिन नहीं लगा सकते।',
    confirmLocationBtn: 'स्थान की पुष्टि करें',
    adjustLocationBtn: 'मैप पर सेट करें',
    locationConfirmed: 'स्थान सत्यापित',
    locationStepTitle: 'गड्ढे का सटीक स्थान',
    landmarkPlaceholder: 'पास का लैंडमार्क (उदा. पेट्रोल पंप के सामने, मेट्रो पिलर १२)',
    landmarkLabel: 'आस-पास का लैंडमार्क (वैकल्पिक)',
    defaultLandmark: 'सड़क पर गहरा गड्ढा',
    submitBtn: 'गड्ढा रिपोर्ट दर्ज करें',
    submitting: 'रिपोर्ट सेव हो रही है...',
    dedupedNotice: 'आपके पास ५ मीटर के अंदर पहले से दर्ज गड्ढा मिला! इसकी संख्या बढ़ा दी गई।',
    submitSuccess: 'धन्यवाद! गड्ढा लाइव मैप पर दर्ज हो चुका है।',
    thanksTitle: 'योगदान के लिए धन्यवाद!',
    thanksSubtitle: 'आपकी रिपोर्ट सफलतापूर्वक दर्ज कर ली गई है। नागरिक सजगता से ही सड़कें सुधरेंगी!',
    thanksHomeBtn: 'मुख्य पृष्ठ पर जाएँ (Home Screen)',
    thanksDedupTitle: 'रिपोर्ट अपडेट की गई!',
    thanksDedupSub: 'यह गड्ढा पहले से दर्ज था, आपकी नई फोटो/रिपोर्ट उसमें जोड़ दी गई है।',
    submitError: 'रिपोर्ट सबमिट करने में समस्या आई। कृपया पुनः प्रयास करें।',
    reportsRemainingBadge: 'आज 5 में से {count} रिपोर्ट बाकी',
    dailyLimitReached: 'आज की सीमा (5/5) पूरी हो चुकी है',
    nextReportAvailable: 'आपकी अगली रिपोर्ट {time} बाद हो सकती है।',
    alreadyReportedButton: 'रिपोर्ट हो चुकी',
    alreadyReportedAlert: 'आपने इस गड्ढे की रिपोर्ट पहले ही कर दी है।',
    tooFarAlert: 'आप इस गड्ढे से बहुत दूर हैं (+1 दर्ज करने के लिए 300m के दायरे में होना जरूरी है)।',
    upvoteSuccess: 'आपका +1 दर्ज हो गया!',
    alreadyUpvoted: 'आप इस गड्ढे पर पहले ही +1 कर चुके हैं।',
    flagPrompt: 'इस गड्ढे को फ्लैग करने का कारण (स्पैम / गलत जानकारी / ठीक हो चुका):',
    flagSuccess: 'गड्ढा समीक्षा के लिए भेजा गया।',
    flagError: 'फ्लैग करने में समस्या आई।',
    consentNotice: 'सबमिट करके, आप सड़क की स्थिति की सार्वजनिक मैपिंग और नियमों से सहमत होते हैं।',
    tipChai: 'चाय टिप',
    tipChaiMobile: 'टिप',
    tipChaiModalTitle: 'सर्वर चाय टिप',
    tipChaiDesc: 'RoadTok १००% फ्री और नागरिक पहल है। सर्वर और मैप खर्च के लिए चाय स्पॉन्सर करें!',
    payViaUpi: 'UPI ऐप से टिप भेजें',
    scanQr: 'या किसी भी UPI ऐप (GPay/PhonePe/Paytm/BHIM) से QR स्कैन करें',
    offlineBanner: 'इंटरनेट बंद है। रिपोर्ट ऑफलाइन सेव रहेगी और वापस ऑनलाइन आते ही अपलोड हो जाएगी।',
    offlineAlert: 'इंटरनेट बंद है। रिपोर्ट फोन में सेव हो गई है और ऑनलाइन आते ही अपलोड हो जाएगी।',
    offlineSyncing: '{count} ऑफलाइन रिपोर्ट सिंक हो रही है...',
    offlineSyncSuccess: 'ऑफलाइन रिपोर्ट लाइव मैप पर सफलतापूर्वक दर्ज हो गई!',
    reportedByCount: '{count} नागरिकों ने पुष्टि की',
    reportedBySingle: '१ नागरिक ने रिपोर्ट किया',
    upvoteBtn: '+१ यहाँ भी है',
    flagBtn: 'गलत / स्पैम पिन',
    shareWhatsapp: 'WhatsApp पर शेयर',
    timeJustNow: 'अभी-अभी',
    timeMinutesAgo: '{n} मिनट पहले',
    timeHoursAgo: '{n} घंटे पहले',
    timeDaysAgo: '{n} दिन पहले',
    whatsappShareTemplate: 'सड़क पर गड्ढे की रिपोर्ट!\nलैंडमार्क: {landmark}\n{count} नागरिकों ने पुष्टि की\nलाइव मैप पर देखें और +1 करें: {url}\n\n(RoadTok - "मेरा गड्ढा, मेरी शान")',
    
    // Leaderboard Strings
    leaderboardTitle: 'लाइव गड्ढा लीडरबोर्ड',
    leaderboardSubtitle: 'देशभर में सबसे चर्चित और गहरे गड्ढों की लाइव रैंकिंग',
    liveBadge: 'LIVE',
    liveUpdatedMinAgo: 'अपडेटेड {n} मिनट पहले',
    tabPotholeOfWeek: 'इस हफ्ते का गड्ढा',
    tabThisWeek: 'इस हफ्ते',
    tabTopCities: 'टॉप शहर',
    tabThisMonth: 'इस महीने',
    tabAllTime: 'सारे समय',
    filterWeek: 'इस हफ्ते',
    filterMonth: 'इस महीने',
    filterAllTime: 'सारे समय',
    heroBadgeRank: 'गड्ढा ऑफ द वीक',
    daysOpenText: '{n} दिन से खुला है',
    shareHeroWhatsapp: 'WhatsApp पर शेयर करो',
    rankRowReports: '{n} रिपोर्ट',
    rankRowUpvotes: '{n} वोट',
    cityReportsCount: '{n} गड्ढे दर्ज',
    leaderboardEmptyTitle: 'अभी कोई गड्ढा नहीं मिला',
    leaderboardEmptyDesc: 'अपने इलाके का गड्ढा रिपोर्ट करें और लीडरबोर्ड पर लाएं!',
    tapToViewOnMap: 'मैप पर देखें ↗',

    // Mission (3 Pillars)
    missionBadge: 'उद्देश्य व प्रभाव',
    missionTitle: 'हमारा उद्देश्य',
    missionSubtitle: 'नागरिक शक्ति और पारदर्शी तकनीक से भारतीय सड़कों को सुरक्षित बनाना',
    pillar1Title: '१. गड्ढों को दृश्यमान बनाना',
    pillar1Desc: 'अक्सर खराब सड़कों की अनदेखी की जाती है। हमारा ओपन मैप हर गड्ढे को वास्तविक GPS लोकेशन और फोटो के साथ सार्वजनिक रूप से उजागर करता है।',
    pillar2Title: '२. नागरिकों को सीधी आवाज़',
    pillar2Desc: 'बिना किसी जटिल ऐप या सरकारी लॉगिन के, हर भारतीय केवल ३० सेकंड में अपने इलाके की सड़क समस्या दर्ज और वोट कर सकता है।',
    pillar3Title: '३. सड़कों को जल्द ठीक कराना',
    pillar3Desc: 'जब गड्ढे सोशल मीडिया और लीडरबोर्ड पर ट्रेंड करते हैं, तो नगर निगम और पीडब्ल्यूडी प्रशासन पर त्वरित मरम्मत का सकारात्मक दबाव बनता है।',

    // How it Works & FAQs
    howItWorksBadge: 'सरल व पारदर्शी',
    howItWorksTitle: 'कैसे काम करता है?',
    howItWorksSubtitle: '३ आसान चरणों में किसी भी खराब सड़क की रिपोर्ट दर्ज करें',
    hwStep1Title: 'फोटो खींचें',
    hwStep1Desc: 'खराब सड़क या गड्ढे की फोटो लें। फोन पर ही EXIF प्राइवेसी सुरक्षित हो जाती है।',
    hwStep2Title: 'GPS लोकेशन लॉक',
    hwStep2Desc: 'सिस्टम सटीक GPS लोकेशन लेता है और 5m के दायरे में डुप्लीकेट को रोकता है।',
    hwStep3Title: 'तुरंत लाइव रिपोर्ट',
    hwStep3Desc: 'पिन लाइव मैप और लीडरबोर्ड पर आ जाता है, जहाँ अन्य नागरिक पुष्टि कर सकते हैं।',
    
    faqTitle: 'अक्सर पूछे जाने वाले सवाल (FAQ)',
    faq1Q: 'क्या मुझे रिपोर्ट करने के लिए लॉगिन या साइन अप करना होगा?',
    faq1A: 'बिल्कुल नहीं! गड्ढे में पार्टी 100% ज़ीरो-लॉगिन है। आप बिना किसी खाते, पासवर्ड या मोबाइल नंबर के सीधे रिपोर्ट और वोट कर सकते हैं।',
    faq2Q: 'क्या मेरा व्यक्तिगत डेटा या लोकेशन ट्रैक होती है?',
    faq2A: 'नहीं। अपलोड की जाने वाली फोटो से EXIF व डिवाइस मेटाडेटा आपके फ़ोन में ही हटा दिया जाता है। हम केवल सड़क के गड्ढे का GPS बिंदु सुरक्षित रखते हैं।',
    faq3Q: 'मेरी फोटो कौन देख सकता है और क्या नियम हैं?',
    faq3A: 'फोटो सार्वजनिक रूप से मैप पर दिखती है ताकि अन्य नागरिक और प्रशासन उसे देख सकें। कृपया केवल सड़क/गड्ढे की फोटो अपलोड करें; चेहरे या वाहन की नंबर प्लेट वर्जित हैं।',

    // About Us
    aboutBadge: 'नागरिक पहल',
    aboutTitle: 'हमारे बारे में',
    aboutSubtitle: '100% स्वतंत्र व नागरिक-संचालित मंच',
    aboutStory: 'RoadTok की शुरुआत भारत के जागरूक नागरिकों द्वारा की गई एक स्वतंत्र नागरिक पहल है। इसका उद्देश्य व्यंग्य और तकनीक के माध्यम से हमारी सड़कों की दुर्दशा पर ध्यान आकर्षित करना और प्रशासन को जवाबदेह बनाना है।',
    aboutDisclaimerTitle: 'महत्वपूर्ण सूचना (Disclaimer):',
    aboutDisclaimerHindi: '• "यह एक नागरिक पहल है, कोई राजनीतिक दल नहीं।"',
    aboutDisclaimerEnglish: '• "This is a citizen initiative, not a political party."',
    aboutDisclaimer: 'यह एक नागरिक पहल है, कोई राजनीतिक दल नहीं।',
    aboutContactBtn: 'संपर्क करें (inforoadtok@gmail.com)',
    contactEmail: 'inforoadtok@gmail.com',

    // Terms & Privacy
    termsBadge: 'कानूनी व पारदर्शिता',
    termsTitle: 'नियम व शर्तें एवं गोपनीयता नीति',
    termsSubtitle: 'इस प्लेटफ़ॉर्म का उपयोग करके आप निम्नलिखित नियमों और गोपनीयता नीतियों से सहमत होते हैं।',
    legalConsentText: 'इस प्लेटफॉर्म का उपयोग करके आप हमारे नियमों और गोपनीयता नीति से सहमत होते हैं।',
    legalDisclaimerHeader: '१. मरम्मत की कोई गारंटी नहीं (No Repair Guarantee)',
    legalDisclaimerText: 'RoadTok एक क्राउड-सोर्स्ड नागरिक मैपिंग टूल है। हम केवल डेटा एकत्र और सार्वजनिक करते हैं; हम किसी भी गड्ढे की मरम्मत करने या सरकारी कार्यवाई की गारंटी नहीं देते।',
    legalContentRulesHeader: '२. यूज़र सामग्री नियम (Content Rules)',
    legalContentRulesText: 'उपयोगकर्ता केवल सड़क के गड्ढों और सड़क क्षति की प्रामाणिक तस्वीरें ही अपलोड करें। किसी भी व्यक्ति का चेहरा, निजी संपत्ति, वाहन की नंबर प्लेट, या आपत्तिजनक सामग्री पोस्ट करना सख्त मना है।',
    legalDataRetentionHeader: '३. डेटा संग्रह और प्राइवेसी (What We Collect)',
    legalDataRetentionText: 'हम कोई व्यक्तिगत नाम या ईमेल स्टोर नहीं करते। केवल फोटो, गड्ढे के GPS निर्देशांक, सुरक्षा के लिए हैशेड IP और अनाम सेशन आईडी दर्ज की जाती है।',
    legalRemovalHeader: '४. सामग्री हटाने का अनुरोध (Removal Requests)',
    legalRemovalText: 'यदि कोई फोटो गलत या आपत्तिजनक है, तो आप फ्लैग बटन का उपयोग कर सकते हैं या inforoadtok@gmail.com पर हटाए जाने का अनुरोध भेज सकते हैं।',
    
    // Footer
    footerCopyright: '© 2026 गड्ढे में पार्टी • 100% Free Civic Tech',
    footerLinksHeader: 'त्वरित लिंक',
    footerLegalHeader: 'कानूनी व प्राइवेसी',
    footerTagline: '"मेरा गड्ढा, मेरी शान"',
    footerMap: 'नक्शा',
    footerLeaderboard: 'लीडरबोर्ड',
    footerMission: 'उद्देश्य',
    footerFaq: 'FAQ',
    footerAbout: 'हमारे बारे में',
    footerTerms: 'नियम व प्राइवेसी',
    closeBtn: 'बंद करें'
  },
  english: {
    appNameHindi: 'Gaddhe Me Party',
    appNameEnglish: 'Pothole Tracker',
    tagline: 'मेरा गड्ढा, मेरी शान',
    heroBadge: 'Free · No login',
    heroTitleHtml: 'Spot It. Report It. <span class="hero-highlight-word font-bold">Fix It.</span>',
    heroDescription: 'Map road hazards and pothole hotspots with live GPS and instant community verification. 100% free and open citizen tool.',
    navMap: 'Map',
    navLeaderboard: 'Leaderboard',
    navMission: 'Our Mission',
    navHowItWorks: 'How it Works',
    navAbout: 'About Us',
    navTerms: 'Terms of Use',
    navPrivacy: 'Privacy Policy',
    switchToLightMode: 'Switch to light mode',
    switchToDarkMode: 'Switch to dark mode',
    themeToggleTooltip: 'Toggle theme (Light / Dark)',
    exploreMapCta: 'Explore map',
    
    // Counter / Stats
    totalCounter: 'Total Potholes',
    todayCounter: 'Today\'s Reports',
    topCity: 'Top City',
    
    // Map & Controls
    locateMe: 'Locate Me',
    locating: 'Locating you...',
    locationFound: 'Location acquired!',
    locationDenied: 'GPS permission denied. Please enable location in browser settings.',
    gpsUnsupported: 'GPS is not supported on this device.',
    aboutBtnTooltip: 'About Citizen Initiative',
    reportBtn: 'Report Bad Road / Pothole',
    zoomInTooltip: 'Zoom In (+)',
    zoomOutTooltip: 'Zoom Out (-)',
    fullscreenTooltip: 'Full Screen',
    exitFullscreenTooltip: 'Exit Full Screen',
    gestureHintMobile: 'Use 2 fingers to move map',
    gestureHintDesktop: 'Use Ctrl + scroll to zoom map',
    
    // Report Form & Actions
    sheetTitle: 'Report a Pothole',
    sheetSubtitle: 'Take a photo, GPS coordinates are automatically tagged',
    closeAriaLabel: 'Close',
    step1Title: '1. Photo',
    step2Title: '2. Location',
    step3Title: '3. Landmark (Optional)',
    changePhotoBtn: 'Change photo',
    tapToPhoto: 'Upload Pothole Photo',
    photoSelected: 'Photo selected',
    takePhoto: 'Take photo / choose file',
    uploadGallery: 'Choose from Gallery',
    photoOptNote: 'Auto-compressed & EXIF privacy stripped (< 200 KB)',
    photoCompressing: 'Optimizing photo...',
    photoOptimized: 'Compressed to {size} KB',
    photoError: 'Error processing photo',
    photoRequiredAlert: 'Uploading pothole photo is required!',
    photoRequiredBtn: 'Upload Pothole Photo First',
    photoUnderReviewTitle: 'Image Processing & Review',
    photoUnderReviewDesc: 'Photo will appear on the public map once approved by Admin.',
    photoUnderReviewBadge: 'Under Review',
    photoRejectedTitle: 'Photo Rejected',
    photoRejectedDesc: 'Photo did not meet guidelines.',
    gpsLocked: 'GPS Location Locked',
    gpsSearching: 'Acquiring precise GPS location...',
    gpsRetry: 'Re-detect GPS',
    gpsAccurateStatus: 'Accurate GPS (±{acc}m)',
    gpsModerateStatus: 'Moderate accuracy GPS (±{acc}m)',
    gpsWeakStatus: 'Weak GPS - Adjust pin on map',
    gpsVerifiedPin: 'Location Confirmed',
    reDetectGpsBtn: 'Re-detect GPS',
    adjustOnMapBtn: 'Adjust on map',
    submitBtnMissingPhoto: 'Add a photo first',
    submitBtnMissingLocation: 'Confirm location on map',
    submitBtnMissingBoth: 'Add photo and location',
    gpsRequiredAlert: 'GPS location is required! Please allow GPS access.',
    dragPinHelper: 'Drag the pin or tap the map to place it exactly where the pothole is.',
    weakGpsWarning: 'GPS signal is weak. Please adjust pin manually on map.',
    maxRadiusExceededAlert: 'You cannot place a pin more than 20km away from your actual GPS location.',
    confirmLocationBtn: 'Confirm Location',
    adjustLocationBtn: 'Adjust on Map',
    locationConfirmed: 'Location Confirmed',
    locationStepTitle: 'Exact Pothole Location',
    landmarkPlaceholder: 'Nearby landmark (e.g. Opposite Petrol Pump, Metro Pillar 12)',
    landmarkLabel: 'Nearby Landmark (Optional)',
    defaultLandmark: 'Damaged Road / Pothole',
    submitBtn: 'Submit Report',
    submitting: 'Saving report...',
    dedupedNotice: 'Existing pothole detected within 5 meters! Report count incremented.',
    submitSuccess: 'Thank you! Pothole is now live on the community map.',
    thanksTitle: 'Thanks for your feedback!',
    thanksSubtitle: 'Your report has been successfully submitted. Public awareness drives better roads!',
    thanksHomeBtn: 'Go to Home Screen',
    thanksDedupTitle: 'Report Updated!',
    thanksDedupSub: 'Existing pothole detected nearby; your report has been attached to it.',
    submitError: 'Failed to submit report. Please try again.',
    reportsRemainingBadge: '{count} of 5 reports left today',
    dailyLimitReached: 'Daily limit (5/5) reached',
    nextReportAvailable: 'Your next report can be submitted in {time}.',
    alreadyReportedButton: 'Reported',
    alreadyReportedAlert: 'You have already reported this pothole.',
    tooFarAlert: 'You are too far from this pin (+1 requires being within 300m).',
    upvoteSuccess: 'Your +1 confirmation was added!',
    alreadyUpvoted: 'You have already upvoted this pothole.',
    flagPrompt: 'Reason for flagging this pin (Spam / Inaccurate / Repaired):',
    flagSuccess: 'Pin flagged for moderation review.',
    flagError: 'Failed to flag pin.',
    consentNotice: 'By submitting, you consent to public road safety mapping and platform terms.',
    
    // Chai Tip
    tipChai: 'Tip Chai',
    tipChaiMobile: 'Tip',
    tipChaiModalTitle: 'Server Chai Tip',
    tipChaiDesc: 'RoadTok is a 100% free citizen tool. Support hosting & map tile costs with a cup of chai!',
    payViaUpi: 'Pay via UPI App',
    scanQr: 'Or scan QR code using any UPI App (GPay/PhonePe/Paytm/BHIM)',
    
    // Offline
    offlineBanner: 'You are offline. Reports are saved locally and will auto-upload when back online.',
    offlineAlert: 'You are offline. Report saved locally and will upload when internet reconnects.',
    offlineSyncing: 'Syncing {count} offline report(s)...',
    offlineSyncSuccess: 'Offline reports successfully synced to live map!',
    reportedByCount: '{count} citizens confirmed',
    reportedBySingle: '1 citizen reported',
    upvoteBtn: '+1 I saw this too',
    flagBtn: 'Flag as Spam',
    shareWhatsapp: 'Share on WhatsApp',
    timeJustNow: 'Just now',
    timeMinutesAgo: '{n}m ago',
    timeHoursAgo: '{n}h ago',
    timeDaysAgo: '{n}d ago',
    whatsappShareTemplate: 'Pothole Alert on Road!\nLandmark: {landmark}\n{count} citizens confirmed\nView on live map & +1: {url}\n\n(RoadTok - "Mera Gaddha, Meri Shan")',
    
    // Leaderboard
    leaderboardTitle: 'Live Pothole Leaderboard',
    leaderboardSubtitle: 'Real-time ranking of most severe and reported road hazards across India',
    liveBadge: 'LIVE',
    liveUpdatedMinAgo: 'Updated {n}m ago',
    tabPotholeOfWeek: 'Pothole of the Week',
    tabThisWeek: 'This Week',
    tabTopCities: 'Top Cities',
    tabThisMonth: 'This Month',
    tabAllTime: 'All Time',
    filterWeek: 'This Week',
    filterMonth: 'This Month',
    filterAllTime: 'All Time',
    heroBadgeRank: 'Pothole of the Week',
    daysOpenText: 'Open for {n} days',
    shareHeroWhatsapp: 'Share on WhatsApp',
    rankRowReports: '{n} reports',
    rankRowUpvotes: '{n} votes',
    cityReportsCount: '{n} potholes',
    leaderboardEmptyTitle: 'No potholes reported yet',
    leaderboardEmptyDesc: 'Be the first to report road damage in your area to put it on the leaderboard!',
    tapToViewOnMap: 'View on Map ↗',

    // Mission (3 Pillars)
    missionBadge: 'Mission & Impact',
    missionTitle: 'Our Mission',
    missionSubtitle: 'Empowering Indian citizens to make roads safer through transparent open technology',
    pillar1Title: '1. Make Potholes Visible',
    pillar1Desc: 'Road damage is frequently overlooked. Our open live map geo-tags every hazard with verified GPS data and photos for the public record.',
    pillar2Title: '2. Give Citizens a Direct Voice',
    pillar2Desc: 'Without cumbersome app downloads or government portal logins, anyone can log and upvote road issues in less than 30 seconds.',
    pillar3Title: '3. Accelerate Road Repairs',
    pillar3Desc: 'When hazardous potholes trend on community leaderboards and social media, local municipal corporations and PWD authorities are prompted to act quickly.',

    // How it Works & FAQs
    howItWorksBadge: 'Simple & Transparent',
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle: 'Report any damaged road in 3 easy steps',
    hwStep1Title: 'Snap Photo',
    hwStep1Desc: 'Take a photo of the bad road or pothole. EXIF privacy metadata is stripped directly on your device.',
    hwStep2Title: 'Lock GPS Location',
    hwStep2Desc: 'System captures accurate GPS coordinates and merges duplicates within a 5m radius.',
    hwStep3Title: 'Instant Live Report',
    hwStep3Desc: 'Your pin goes live on the interactive map and leaderboard, where fellow citizens can verify with +1 votes.',
    
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faq1Q: 'Do I need to sign up or create an account to report?',
    faq1A: 'Not at all! Gaddhe Me Party is 100% zero-login. You can report hazards and upvote immediately without accounts, passwords, or phone numbers.',
    faq2Q: 'Is my personal data or private location tracked?',
    faq2A: 'No personal tracking occurs. All camera EXIF metadata is stripped directly on your device. We only store the public coordinates of the road hazard.',
    faq3Q: 'Who sees my photo and what are the upload rules?',
    faq3A: 'Uploaded photos are displayed publicly on the map. Please only upload road hazard photos; human faces, private property, and vehicle number plates are strictly prohibited.',

    // About Us
    aboutBadge: 'Civic Initiative',
    aboutTitle: 'About Us',
    aboutSubtitle: '100% Independent & Citizen-Driven Platform',
    aboutStory: 'RoadTok was created by proactive Indian citizens as an independent civic initiative. We use civic tech and gentle satire to spotlight neglected road infrastructure and foster public accountability.',
    aboutDisclaimerTitle: 'Important Disclaimer:',
    aboutDisclaimerHindi: '• "यह एक नागरिक पहल है, कोई राजनीतिक दल नहीं।"',
    aboutDisclaimerEnglish: '• "This is a citizen initiative, not a political party."',
    aboutDisclaimer: 'This is a citizen initiative, not a political party.',
    aboutContactBtn: 'Contact Us (inforoadtok@gmail.com)',
    contactEmail: 'inforoadtok@gmail.com',

    // Terms & Privacy
    termsBadge: 'Legal & Transparency',
    termsTitle: 'Terms of Use & Privacy Policy',
    termsSubtitle: 'By accessing this platform, you agree to the following terms and privacy policies.',
    legalConsentText: 'By accessing this platform, you agree to our terms and privacy policy.',
    legalDisclaimerHeader: '1. No Repair Guarantee',
    legalDisclaimerText: 'RoadTok is a crowdsourced citizen mapping tool. We collect and publish public civic data, but we do not guarantee municipal repairs or official government response.',
    legalContentRulesHeader: '2. User Content Rules',
    legalContentRulesText: 'Users must upload only authentic photos of road damage. Uploading faces, private residences, license plates, or abusive imagery is strictly prohibited.',
    legalDataRetentionHeader: '3. Data Collection & Privacy',
    legalDataRetentionText: 'We do not collect names or emails. Only the hazard image, GPS coordinates, hashed IP for anti-spam limits, and anonymous session IDs are stored.',
    legalRemovalHeader: '4. Content Removal Requests',
    legalRemovalText: 'If you believe a photo violates guidelines or needs removal, use the Flag button or email inforoadtok@gmail.com with the pin details.',
    
    // Footer
    footerCopyright: '© 2026 Gaddhe Me Party • 100% Free Civic Tech',
    footerLinksHeader: 'Quick Links',
    footerLegalHeader: 'Legal & Privacy',
    footerTagline: '"मेरा गड्ढा, मेरी शान"',
    footerMap: 'Map',
    footerLeaderboard: 'Leaderboard',
    footerMission: 'Mission',
    footerFaq: 'FAQ',
    footerAbout: 'About Us',
    footerTerms: 'Terms & Privacy',
    closeBtn: 'Close'
  }
};

let currentLanguage = localStorage.getItem('khadda_lang') || 'hindi';

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('khadda_lang', lang);
    renderAllPageI18n();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }
}

export function t(key, replacements = {}) {
  const dict = translations[currentLanguage] || translations.hindi;
  let text = dict[key] !== undefined ? dict[key] : (translations.hindi[key] !== undefined ? translations.hindi[key] : key);
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

export function renderAllPageI18n() {
  const lang = getLanguage();
  document.documentElement.lang = lang === 'hindi' ? 'hi' : 'en';

  // Update textContent for elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Update innerHTML for elements with data-i18n-html
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) {
      el.innerHTML = t(key);
    }
  });

  // Update title for elements with data-i18n-title
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.setAttribute('title', t(key));
    }
  });

  // Update aria-label for elements with data-i18n-aria
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) {
      el.setAttribute('aria-label', t(key));
    }
  });

  // Update placeholder for elements with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.setAttribute('placeholder', t(key));
    }
  });
}
