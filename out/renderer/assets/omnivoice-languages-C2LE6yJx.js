import { p as persist } from "./index-B8Pnvlyd.js";
import { c as create } from "./zustand-DqfYAuvg.js";
const DEFAULT_TTS_ADVANCED_SETTINGS = {
  audioChunkDuration: 15,
  audioChunkThreshold: 30,
  guidanceScale: 2,
  tShift: 0.1,
  positionTemperature: 5,
  classTemperature: 0,
  layerPenaltyFactor: 5,
  denoise: true,
  preprocessPrompt: true,
  postprocessOutput: true,
  padDuration: 0.1,
  fadeDuration: 0.1
};
const useTtsStore = create()(
  persist(
    (set) => ({
      selectedEngineId: "omnivoice",
      selectedModelId: "omnivoice-main",
      text: "",
      instruction: "",
      mode: "clone",
      language: "vi",
      savedLanguages: [],
      speed: 1,
      numStep: 24,
      splitMode: "default",
      capcutLanguage: "vi-VN",
      capcutVoiceType: "BV421_vivn_streaming",
      geminiLanguage: "vi-VN",
      geminiVoiceName: "Puck",
      geminiStyle: "",
      geminiTemperature: 1,
      vbeeVoiceCode: "hn_female_ngochuyen_full_48k-fhg",
      vbeeVoiceName: "HN - Ngọc Huyền",
      vbeeAudioType: "mp3",
      vbeeBitrate: 128,
      vieneuVoice: "Trúc Ly",
      vieneuStyle: "tu_nhien",
      vbeeFavoriteVoiceCodes: [],
      advancedEnabled: false,
      advancedSettings: { ...DEFAULT_TTS_ADVANCED_SETTINGS },
      voiceProfiles: [],
      history: [],
      hasSeenModelPrompt: false,
      setSelectedEngineId: (selectedEngineId) => set({ selectedEngineId }),
      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
      setText: (text) => set({ text }),
      setInstruction: (instruction) => set({ instruction }),
      setMode: (mode) => set({ mode }),
      setLanguage: (language) => set({ language }),
      addSavedLanguage: (language) => set((state) => ({
        savedLanguages: [
          ...state.savedLanguages.filter((item) => item.code !== language.code),
          language
        ].sort((left, right) => left.name.localeCompare(right.name))
      })),
      removeSavedLanguage: (code) => set((state) => ({
        savedLanguages: state.savedLanguages.filter((language) => language.code !== code),
        language: state.language === code ? "auto" : state.language
      })),
      setSpeed: (speed) => set({ speed }),
      setNumStep: (numStep) => set({ numStep }),
      setSplitMode: (splitMode) => set({ splitMode }),
      setCapcutLanguage: (capcutLanguage) => set({ capcutLanguage }),
      setCapcutVoiceType: (capcutVoiceType) => set({ capcutVoiceType }),
      setGeminiLanguage: (geminiLanguage) => set({ geminiLanguage }),
      setGeminiVoiceName: (geminiVoiceName) => set({ geminiVoiceName }),
      setGeminiStyle: (geminiStyle) => set({ geminiStyle }),
      setGeminiTemperature: (geminiTemperature) => set({ geminiTemperature }),
      setVbeeVoiceCode: (vbeeVoiceCode) => set({ vbeeVoiceCode }),
      setVbeeVoiceName: (vbeeVoiceName) => set({ vbeeVoiceName }),
      toggleVbeeFavoriteVoice: (voiceCode) => set((state) => ({
        vbeeFavoriteVoiceCodes: state.vbeeFavoriteVoiceCodes.includes(voiceCode) ? state.vbeeFavoriteVoiceCodes.filter((code) => code !== voiceCode) : [voiceCode, ...state.vbeeFavoriteVoiceCodes]
      })),
      setVbeeAudioType: (vbeeAudioType) => set({ vbeeAudioType }),
      setVbeeBitrate: (vbeeBitrate) => set({ vbeeBitrate }),
      setVieneuVoice: (vieneuVoice) => set({ vieneuVoice }),
      setVieneuStyle: (vieneuStyle) => set({ vieneuStyle }),
      setAdvancedEnabled: (advancedEnabled) => set({ advancedEnabled }),
      setAdvancedSetting: (key, value) => set((state) => ({
        advancedSettings: { ...state.advancedSettings, [key]: value }
      })),
      resetAdvancedSettings: () => set({ advancedSettings: { ...DEFAULT_TTS_ADVANCED_SETTINGS } }),
      setSelectedProfileId: (selectedProfileId) => set({ selectedProfileId }),
      addVoiceProfile: (profile) => set((state) => ({
        voiceProfiles: [profile, ...state.voiceProfiles.filter((item) => item.id !== profile.id)],
        selectedProfileId: profile.id
      })),
      removeVoiceProfile: (id) => set((state) => ({
        voiceProfiles: state.voiceProfiles.filter((item) => item.id !== id),
        selectedProfileId: state.selectedProfileId === id ? void 0 : state.selectedProfileId
      })),
      addHistory: (item) => set((state) => ({ history: [item, ...state.history].slice(0, 100) })),
      renameHistory: (id, name) => set((state) => ({
        history: state.history.map((item) => item.id === id ? { ...item, name } : item)
      })),
      removeHistory: (id) => set((state) => ({ history: state.history.filter((item) => item.id !== id) })),
      markModelPromptSeen: () => set({ hasSeenModelPrompt: true })
    }),
    {
      name: "tts-voice-store-v1",
      version: 12,
      migrate: (persisted) => {
        const state = persisted || {};
        return {
          ...state,
          selectedEngineId: state.selectedEngineId || "omnivoice",
          selectedModelId: state.selectedModelId || "omnivoice-main",
          mode: state.mode || "clone",
          language: state.language || "vi",
          savedLanguages: state.savedLanguages || [],
          speed: state.speed || 1,
          numStep: state.numStep || 24,
          splitMode: state.splitMode || (state.readByLine ? "line" : "default"),
          capcutLanguage: state.capcutLanguage || "vi-VN",
          capcutVoiceType: state.capcutVoiceType || "BV421_vivn_streaming",
          geminiLanguage: state.geminiLanguage || "vi-VN",
          geminiVoiceName: state.geminiVoiceName || "Puck",
          geminiStyle: state.geminiStyle || "",
          geminiTemperature: Number.isFinite(state.geminiTemperature) ? state.geminiTemperature : 1,
          vbeeVoiceCode: state.vbeeVoiceCode || "hn_female_ngochuyen_full_48k-fhg",
          vbeeVoiceName: state.vbeeVoiceName || "HN - Ngọc Huyền",
          vbeeFavoriteVoiceCodes: state.vbeeFavoriteVoiceCodes || [],
          vbeeAudioType: state.vbeeAudioType || "mp3",
          vbeeBitrate: state.vbeeBitrate || 128,
          vieneuVoice: state.vieneuVoice || "Trúc Ly",
          vieneuStyle: state.vieneuStyle || "tu_nhien",
          advancedEnabled: state.advancedEnabled || false,
          advancedSettings: {
            ...DEFAULT_TTS_ADVANCED_SETTINGS,
            ...state.advancedSettings || {}
          },
          selectedProfileId: void 0
        };
      }
    }
  )
);
const languageMapSource = "language_id	language_name	iso_639_3_id	train_data_duration\naae	Arbëreshë Albanian	aae	6.11\naal	Afade	aal	10.19\naao	Algerian Saharan Arabic	aao	2.02\nab	Abkhazian	abk	57.27\nabb	Bankon	abb	11.2\nabn	Abua	abn	10.27\nabr	Abron	abr	9.22\nabs	Ambonese Malay	abs	10.03\nabv	Baharna Arabic	abv	10.41\nacm	Mesopotamian Arabic	acm	3.78\nacw	Hijazi Arabic	acw	22.32\nacx	Omani Arabic	acx	22.03\nadf	Dhofari Arabic	adf	0.31\nadx	Amdo Tibetan	adx	56.94\nady	Adyghe	ady	32.6\naeb	Tunisian Arabic	aeb	21.63\naec	Saidi Arabic	aec	9.28\naf	Afrikaans	afr	4.4\nafb	Gulf Arabic	afb	98.55\nafo	Eloyi	afo	11.21\nahl	Igo	ahl	9.22\nahs	Ashe	ahs	10.62\najg	Aja (Benin)	ajg	5.63\naju	Judeo-Moroccan Arabic	aju	7.21\nala	Alago	ala	11.04\naln	Gheg Albanian	aln	3.92\nalo	Larike-Wakasihu	alo	9.97\nam	Amharic	amh	12.83\namu	Guerrero Amuzgo	amu	10.1\nan	Aragonese	arg	16.4\nanc	Ngas	anc	10.14\nank	Goemai	ank	10.0\nanp	Angika	anp	10.65\nanw	Anaang	anw	9.65\naom	Ömie	aom	8.19\napc	Levantine Arabic	apc	15.65\napd	Sudanese Arabic	apd	9.93\narb	Standard Arabic	arb	1483.53\narq	Algerian Arabic	arq	9.64\nars	Najdi Arabic	ars	203.54\nary	Moroccan Arabic	ary	104.67\narz	Egyptian Arabic	arz	23.23\nas	Assamese	asm	270.85\nast	Asturian	ast	8.48\navl	Eastern Egyptian Bedawi Arabic	avl	1.86\nawo	Awak	awo	10.22\nayl	Libyan Arabic	ayl	20.13\nayp	North Mesopotamian Arabic	ayp	10.92\naz	Azerbaijani	aze	9.84\nba	Bashkir	bak	249.1\nbag	Tuki	bag	10.97\nbas	Basa (Cameroon)	bas	10.66\nbax	Bamun	bax	10.24\nbba	Baatonum	bba	10.53\nbbj	Ghomálá'	bbj	7.32\nbbl	Bats	bbl	11.22\nbbu	Kulung (Nigeria)	bbu	10.39\nbce	Bamenyam	bce	9.9\nbci	Baoulé	bci	10.21\nbcs	Kohumono	bcs	10.45\nbcy	Bacama	bcy	9.94\nbda	Bayot	bda	9.47\nbde	Bade	bde	9.89\nbdm	Buduma	bdm	10.17\nbe	Belarusian	bel	1809.43\nbeb	Bebele	beb	7.52\nbew	Betawi	bew	11.15\nbfd	Bafut	bfd	9.03\nbft	Balti	bft	16.28\nbg	Bulgarian	bul	2190.76\nbgp	Eastern Balochi	bgp	10.98\nbhb	Bhili	bhb	9.98\nbhh	Bukharic	bhh	11.38\nbho	Bhojpuri	bho	10.05\nbhp	Bima	bhp	10.67\nbhr	Bara Malagasy	bhr	12.14\nbjj	Kanauji	bjj	11.01\nbjk	Barok	bjk	10.16\nbjn	Banjar	bjn	11.68\nbjt	Balanta-Ganja	bjt	9.41\nbkh	Bakoko	bkh	6.0\nbkm	Kom (Cameroon)	bkm	10.76\nbky	Bokyi	bky	9.85\nbmm	Northern Betsimisaraka Malagasy	bmm	19.12\nbmq	Bomu	bmq	10.68\nbn	Bengali	ben	271.76\nbnm	Batanga	bnm	15.01\nbnn	Bunun	bnn	9.26\nbns	Bundeli	bns	10.88\nbo	Tibetan	bod	82.27\nbou	Bondei	bou	9.98\nbqg	Bago-Kusuntu	bqg	8.86\nbr	Breton	bre	25.48\nbra	Braj	bra	10.68\nbrh	Brahui	brh	19.89\nbri	Mokpwe	bri	7.53\nbrx	Bodo	brx	231.57\nbs	Bosnian	bos	690.73\nbsh	Kati	bsh	8.77\nbsj	Bangwinji	bsj	10.0\nbsk	Burushaski	bsk	9.14\nbtm	Batak Mandailing	btm	11.09\nbtv	Bateri	btv	9.8\nbug	Buginese	bug	11.09\nbum	Bulu (Cameroon)	bum	9.06\nbuo	Terei	buo	9.48\nbux	Boghom	bux	10.48\nbwr	Bura-Pabir	bwr	10.4\nbxf	Bilur	bxf	10.84\nbyc	Ubaghara	byc	11.11\nbys	Burak	bys	9.92\nbyv	Medumba	byv	10.95\nbyx	Qaqet	byx	9.79\nbzc	Southern Betsimisaraka Malagasy	bzc	17.45\nbzw	Basa (Nigeria)	bzw	10.27\nca	Catalan	cat	3358.6\nccg	Samba Daka	ccg	10.11\nceb	Cebuano	ceb	12.17\ncen	Cen	cen	9.85\ncfa	Dijim-Bwilim	cfa	10.32\ncgg	Chiga	cgg	10.84\nchq	Quiotepec Chinantec	chq	9.76\ncjk	Chokwe	cjk	11.01\nckb	Central Kurdish	ckb	137.52\nckl	Cibak	ckl	10.91\nckr	Kairak	ckr	10.51\ncky	Cakfem-Mushere	cky	8.96\ncnh	Hakha Chin	cnh	2.24\ncpy	South Ucayali Ashéninka	cpy	9.15\ncs	Czech	ces	148.13\ncte	Tepinapa Chinantec	cte	9.54\nctl	Tlacoatzintepec Chinantec	ctl	10.04\ncut	Teutila Cuicatec	cut	8.04\ncux	Tepeuxila Cuicatec	cux	7.83\ncv	Chuvash	chv	23.96\ncy	Welsh	cym	131.21\nda	Danish	dan	1665.98\ndag	Dagbani	dag	10.14\ndar	Dargwa	dar	1.22\ndav	Taita	dav	9.12\ndbd	Dadiya	dbd	9.61\ndcc	Deccan	dcc	10.38\nde	German	deu	21927.13\ndeg	Degema	deg	11.07\ndgh	Dghwede	dgh	9.95\ndgo	Dogri	dgo	117.04\ndje	Zarma	dje	10.72\ndmk	Domaaki	dmk	6.38\ndml	Dameli	dml	9.18\ndru	Rukai	dru	9.26\ndty	Dotyali	dty	10.85\ndua	Duala	dua	12.13\ndv	Dhivehi	div	38.61\ndyu	Dyula	dyu	0.34\ndzg	Dazaga	dzg	9.96\nebr	Ebrié	ebr	1.5\nebu	Embu	ebu	9.81\nego	Eggon	ego	9.95\neiv	Askopan	eiv	10.44\neko	Koti	eko	8.15\nekr	Yace	ekr	10.76\nel	Greek	ell	2412.54\nelm	Eleme	elm	11.27\nen	English	eng	206061.1\neo	Esperanto	epo	1396.64\nes	Spanish	spa	27559.74\nesu	Central Yupik	esu	2.18\net	Estonian	est	960.37\neto	Eton (Cameroon)	eto	7.43\nets	Yekhee	ets	10.11\netu	Ejagham	etu	10.3\neu	Basque	eus	479.86\newo	Ewondo	ewo	12.71\next	Extremaduran	ext	13.59\neyo	Keiyo	eyo	9.24\nfa	Persian	fas	366.07\nfan	Fang (Equatorial Guinea)	fan	3.51\nfat	Fanti	fat	11.38\nff	Fulah	ful	13.84\nffm	Maasina Fulfulde	ffm	10.46\nfi	Finnish	fin	468.62\nfia	Nobiin	fia	9.96\nfil	Filipino	fil	7.71\nfip	Fipa	fip	10.55\nfkk	Kirya-Konzəl	fkk	9.98\nfmp	Fe'fe'	fmp	9.86\nfr	French	fra	23675.32\nfub	Adamawa Fulfulde	fub	13.12\nfuc	Pulaar	fuc	14.77\nfue	Borgu Fulfulde	fue	20.1\nfuf	Pular	fuf	13.77\nfuh	Western Niger Fulfulde	fuh	9.69\nfui	Bagirmi Fulfulde	fui	15.04\nfuq	Central-Eastern Niger Fulfulde	fuq	9.28\nfuv	Nigerian Fulfulde	fuv	9.97\nfy	Western Frisian	fry	70.41\nga	Irish	gle	21.4\ngbm	Garhwali	gbm	19.14\ngbr	Gbagyi	gbr	12.12\ngby	Gbari	gby	12.59\ngcc	Mali	gcc	9.87\ngdf	Guduf-Gava	gdf	12.21\ngej	Gen	gej	5.39\nges	Geser-Gorom	ges	10.08\nggg	Gurgula	ggg	7.12\ngid	Gidar	gid	10.06\ngig	Goaria	gig	9.41\ngiz	South Giziga	giz	10.03\ngjk	Kachi Koli	gjk	20.83\ngju	Gujari	gju	8.66\ngl	Galician	glg	208.81\nglw	Glavda	glw	10.51\ngn	Guarani	grn	4.06\ngol	Gola	gol	9.26\ngom	Goan Konkani	gom	9.82\ngsl	Gusilay	gsl	10.0\ngu	Gujarati	guj	91.18\ngui	Eastern Bolivian Guaraní	gui	22.72\ngur	Farefare	gur	9.24\nguz	Gusii	guz	9.5\ngv	Manx	glv	10.07\ngwc	Gawri	gwc	10.83\ngwe	Gweno	gwe	8.87\ngwt	Gawar-Bati	gwt	12.16\ngya	Northwest Gbaya	gya	8.45\ngyz	Geji	gyz	10.49\nha	Hausa	hau	17.75\nhah	Hahon	hah	9.64\nhao	Hakö	hao	8.56\nhaw	Hawaiian	haw	11.79\nhaz	Hazaragi	haz	9.69\nhbb	Huba	hbb	10.7\nhe	Hebrew	heb	13.4\nhem	Hemba	hem	9.53\nhi	Hindi	hin	117.17\nhia	Lamang	hia	11.07\nhkk	Hunjara-Kaina Ke	hkk	8.69\nhla	Halia	hla	9.86\nhno	Northern Hindko	hno	20.04\nhoj	Hadothi	hoj	10.08\nhr	Croatian	hrv	2795.31\nhsb	Upper Sorbian	hsb	2.71\nht	Haitian	hat	0.04\nhu	Hungarian	hun	255.83\nhue	San Francisco Del Mar Huave	hue	9.45\nhul	Hula	hul	10.33\nhux	Nüpode Huitoto	hux	9.04\nhwo	Hwana	hwo	11.23\nhy	Armenian	hye	42.15\nhz	Herero	her	9.59\nia	Interlingua (International Auxiliary Language Association)	ina	13.48\nibb	Ibibio	ibb	7.38\nid	Indonesian	ind	6327.87\nida	Idakho-Isukha-Tiriki	ida	9.31\nidu	Idoma	idu	11.16\nig	Igbo	ibo	13.69\nijc	Izon	ijc	9.95\nijn	Kalabari	ijn	11.04\nik	Inupiaq	ipk	2.11\nikw	Ikwere	ikw	10.0\nis	Icelandic	isl	647.29\nish	Esan	ish	10.05\niso	Isoko	iso	10.33\nit	Italian	ita	9402.46\nits	Isekiri	its	11.85\nitw	Ito	itw	9.19\nitz	Itzá	itz	7.08\nja	Japanese	jpn	36914.4\njal	Yalahatan	jal	11.18\njax	Jambi Malay	jax	10.29\njgo	Ngomba	jgo	10.15\njmx	Western Juxtlahuaca Mixtec	jmx	10.01\njns	Jaunsari	jns	11.25\njqr	Jaqaru	jqr	9.32\njuk	Wapan	juk	10.22\njuo	Jiba	juo	10.43\njv	Javanese	jav	11.19\nka	Georgian	kat	156.96\nkab	Kabyle	kab	529.52\nkai	Karekare	kai	10.52\nkaj	Jju	kaj	10.16\nkam	Kamba	kam	14.72\nkbd	Kabardian	kbd	108.35\nkbl	Kanembu	kbl	10.19\nkbt	Abadi	kbt	9.73\nkcq	Kamo	kcq	10.49\nkdh	Tem	kdh	4.07\nkea	Kabuverdianu	kea	10.51\nkeu	Akebu	keu	9.1\nkfe	Kota (India)	kfe	10.25\nkfk	Kinnauri	kfk	10.32\nkfp	Korwa	kfp	11.87\nkhg	Khams Tibetan	khg	6.38\nkhw	Khowar	khw	15.55\nkj	Kuanyama	kua	9.88\nkjc	Coastal Konjo	kjc	10.18\nkjk	Highland Konjo	kjk	10.21\nkk	Kazakh	kaz	1537.29\nkln	Kalenjin	kln	40.42\nkls	Kalasha	kls	9.11\nkm	Khmer	khm	7.1\nkmr	Northern Kurdish	kmr	69.59\nkmy	Koma	kmy	10.28\nkn	Kannada	kan	128.06\nkna	Dera (Nigeria)	kna	11.91\nknn	Konkani	knn	112.83\nko	Korean	kor	8609.28\nkol	Kol (Papua New Guinea)	kol	9.95\nkoo	Konzo	koo	13.23\nkpo	Ikposo	kpo	7.83\nkqo	Eastern Krahn	kqo	9.28\nks	Kashmiri	kas	110.42\nksd	Kuanua	ksd	9.91\nksf	Bafia	ksf	16.43\nkto	Kuot	kto	9.77\nkuh	Kushi	kuh	10.35\nkvx	Parkari Koli	kvx	11.04\nkw	Cornish	cor	12.15\nkwm	Kwambi	kwm	9.9\nkxp	Wadiyara Koli	kxp	20.0\nky	Kirghiz	kir	46.63\nkyx	Rapoisi	kyx	9.17\nlag	Rangi	lag	9.47\nlb	Luxembourgish	ltz	8.46\nlcm	Tungag	lcm	9.77\nldb	Dũya	ldb	11.31\nlg	Ganda	lug	447.82\nlij	Ligurian	lij	15.97\nlir	Liberian English	lir	10.26\nlkb	Kabras	lkb	9.99\nlla	Lala-Roba	lla	10.38\nln	Lingala	lin	17.99\nlnu	Longuda	lnu	10.46\nlo	Lao	lao	7.63\nloa	Loloda	loa	9.31\nlrk	Loarki	lrk	10.5\nlss	Lasi	lss	6.53\nlt	Lithuanian	lit	2629.45\nltg	Latgalian	ltg	27.23\nlto	Tsotso	lto	9.77\nlua	Luba-Lulua	lua	8.47\nluo	Luo	luo	36.17\nlus	Lushai	lus	20.24\nlv	Latvian	lav	1441.58\nlwg	Wanga	lwg	9.36\nmab	Yutanduchi Mixtec	mab	9.26\nmaf	Mafa	maf	9.97\nmai	Maithili	mai	131.37\nmau	Huautla Mazatec	mau	6.39\nmax	North Moluccan Malay	max	9.43\nmbo	Mbo (Cameroon)	mbo	9.51\nmcf	Matsés	mcf	9.61\nmcn	Masana	mcn	10.09\nmcx	Mpiemo	mcx	9.88\nmdd	Mbum	mdd	9.82\nmde	Maba (Chad)	mde	9.5\nmdf	Moksha	mdf	0.47\nmek	Mekeo	mek	9.18\nmer	Meru	mer	9.89\nmeu	Motu	meu	9.88\nmfm	Marghi South	mfm	10.05\nmfn	Cross River Mbembe	mfn	10.03\nmfo	Mbe	mfo	10.24\nmfv	Mandjak	mfv	9.55\nmgg	Mpumpong	mgg	4.94\nmgi	Lijili	mgi	10.89\nmhk	Mungaka	mhk	7.53\nmhr	Eastern Mari	mhr	272.31\nmi	Maori	mri	18.02\nmig	San Miguel El Grande Mixtec	mig	9.66\nmiu	Cacaloxtepec Mixtec	miu	9.18\nmk	Macedonian	mkd	27.21\nmkf	Miya	mkf	10.16\nmki	Dhatki	mki	8.83\nml	Malayalam	mal	166.57\nmlq	Western Maninkakan	mlq	9.83\nmn	Mongolian	mon	269.08\nmne	Naba	mne	10.37\nmni	Manipuri	mni	44.46\nmqy	Manggarai	mqy	10.5\nmr	Marathi	mar	156.71\nmrj	Western Mari	mrj	32.26\nmrr	Maria (India)	mrr	11.0\nmrt	Marghi Central	mrt	10.36\nms	Malay	msa	9.57\nmse	Musey	mse	7.21\nmsh	Masikoro Malagasy	msh	14.16\nmsw	Mansoanka	msw	9.32\nmt	Maltese	mlt	630.29\nmtr	Mewari	mtr	10.58\nmtu	Tututepec Mixtec	mtu	10.13\nmtx	Tidaá Mixtec	mtx	9.09\nmua	Mundang	mua	9.2\nmug	Musgu	mug	4.74\nmui	Musi	mui	10.52\nmve	Marwari (Pakistan)	mve	9.96\nmvy	Indus Kohistani	mvy	21.64\nmxs	Huitepec Mixtec	mxs	9.64\nmxu	Mada (Cameroon)	mxu	12.0\nmxy	Southeastern Nochixtlán Mixtec	mxy	9.48\nmy	Burmese	mya	12.14\nmyv	Erzya	myv	3.1\nmzl	Mazatlán Mixe	mzl	10.05\nnal	Nalik	nal	10.33\nnan	Min Nan Chinese	nan	17.55\nnap	Neapolitan	nap	9.97\nnb	Norwegian Bokmål	nob	12.7\nnbh	Ngamo	nbh	10.04\nncf	Notsi	ncf	9.84\nnco	Sibe	nco	9.96\nncx	Central Puebla Nahuatl	ncx	9.86\nndi	Samba Leko	ndi	11.27\nng	Ndonga	ndo	9.08\nngi	Ngizim	ngi	10.06\nnhg	Tetelcingo Nahuatl	nhg	8.92\nnhi	Zacatlán-Ahuacatlán-Tepetzintla Nahuatl	nhi	0.05\nnhn	Central Nahuatl	nhn	9.51\nnhq	Huaxcaleca Nahuatl	nhq	5.07\nnja	Nzanyi	nja	10.02\nnl	Dutch	nld	2264.13\nnla	Ngombale	nla	8.79\nnlv	Orizaba Nahuatl	nlv	11.42\nnmg	Kwasio	nmg	10.39\nnmz	Nawdm	nmz	6.3\nnn	Norwegian Nynorsk	nno	1.54\nnnh	Ngiemboon	nnh	16.15\nno	Norwegian	nor	3849.8\nnoe	Nimadi	noe	11.12\nnpi	Nepali	npi	171.5\nnso	Pedi	nso	12.64\nny	Chichewa	nya	10.8\nnyu	Nyungwe	nyu	8.98\noc	Occitan	oci	16.8\nodk	Od	odk	20.26\nodu	Odual	odu	10.57\nogo	Khana	ogo	10.51\nom	Oromo	orm	6.6\norc	Orma	orc	22.01\noru	Ormuri	oru	16.74\nory	Odia	ory	144.81\nos	Iron Ossetic	oss	1.38\npa	Panjabi	pan	147.37\npbs	Central Pame	pbs	9.69\npbt	Southern Pashto	pbt	11.6\npbu	Northern Pashto	pbu	11.03\npcm	Nigerian Pidgin	pcm	11.04\npex	Petats	pex	10.2\nphl	Phalura	phl	20.69\nphr	Pahari-Potwari	phr	24.03\npip	Pero	pip	9.85\npiy	Piya-Kwonci	piy	10.38\npko	Pökoot	pko	10.4\npl	Polish	pol	911.68\nplk	Kohistani Shina	plk	12.75\nplt	Plateau Malagasy	plt	19.39\npmq	Northern Pame	pmq	10.24\npms	Piemontese	pms	16.01\npmy	Papuan Malay	pmy	10.17\npnb	Western Panjabi	pnb	10.0\npoc	Poqomam	poc	9.63\npoe	San Juan Atzingo Popoloca	poe	10.01\npow	San Felipe Otlaltepec Popoloca	pow	8.84\nprq	Ashéninka Perené	prq	7.16\nps	Pushto	pus	88.62\npst	Central Pashto	pst	11.4\npt	Portuguese	por	16855.05\npua	Western Highland Purepecha	pua	10.17\npwn	Paiwan	pwn	13.76\nqug	Chimborazo Highland Quichua	qug	10.12\nqum	Sipacapense	qum	9.37\nqup	Southern Pastaza Quechua	qup	11.13\nqur	Yanahuanca Pasco Quechua	qur	9.95\nqus	Santiago del Estero Quichua	qus	9.55\nquv	Sacapulteco	quv	8.9\nqux	Yauyos Quechua	qux	9.35\nquy	Ayacucho Quechua	quy	0.05\nqva	Ambo-Pasco Quechua	qva	9.59\nqvi	Imbabura Highland Quichua	qvi	11.0\nqvj	Loja Highland Quichua	qvj	10.59\nqvl	Cajatambo North Lima Quechua	qvl	9.95\nqwa	Corongo Ancash Quechua	qwa	9.72\nqws	Sihuas Ancash Quechua	qws	10.18\nqxa	Chiquián Ancash Quechua	qxa	9.99\nqxp	Puno Quechua	qxp	9.81\nqxt	Santa Ana de Tusi Pasco Quechua	qxt	10.05\nqxu	Arequipa-La Unión Quechua	qxu	10.12\nqxw	Jauja Wanca Quechua	qxw	11.42\nrag	Logooli	rag	9.39\nrm	Romansh	roh	9.21\nro	Romanian	ron	70.23\nrob	Tae'	rob	9.02\nrof	Rombo	rof	18.9\nroo	Rotokas	roo	9.07\nrth	Ratahan	rth	9.34\nru	Russian	rus	20338.5\nrup	Macedo-Romanian	rup	0.02\nrw	Kinyarwanda	kin	2021.66\nsa	Sanskrit	san	84.44\nsah	Yakut	sah	16.08\nsat	Santali	sat	98.37\nsau	Saleman	sau	10.53\nsay	Saya	say	10.02\nsbn	Sindhi Bhil	sbn	10.53\nsc	Sardinian	srd	2.77\nscl	Shina	scl	9.84\nscn	Sicilian	scn	13.35\nsd	Sindhi	snd	46.27\nsei	Seri	sei	9.81\nshu	Chadian Arabic	shu	2.29\nsi	Sinhala	sin	11.98\nsip	Sikkimese	sip	10.07\nsiw	Siwai	siw	10.47\nsjr	Siar-Lak	sjr	9.87\nsk	Slovak	slk	2478.46\nskg	Sakalava Malagasy	skg	9.02\nskr	Saraiki	skr	4.13\nsl	Slovenian	slv	1172.61\nsn	Shona	sna	9.96\nsnc	Sinaugoro	snc	10.38\nsnk	Soninke	snk	10.04\nso	Somali	som	13.22\nsol	Solos	sol	9.95\nsps	Saposa	sps	9.81\nsq	Albanian	sqi	8.59\nsr	Serbian	srp	1855.33\nsrc	Logudorese Sardinian	src	10.67\nsro	Campidanese Sardinian	sro	10.16\nssi	Sansi	ssi	10.47\nste	Liana-Seti	ste	10.43\nsua	Sulka	sua	10.12\nsv	Swedish	swe	2453.14\nsva	Svan	sva	15.11\nsw	Swahili	swa	418.41\nszy	Sakizaya	szy	11.47\nta	Tamil	tam	423.09\ntan	Tangale	tan	10.14\ntar	Central Tarahumara	tar	9.73\ntay	Atayal	tay	7.02\ntbf	Mandara	tbf	10.01\ntcf	Malinaltepec Me'phaa	tcf	9.04\ntcy	Tulu	tcy	11.72\ntdn	Tondano	tdn	9.14\ntdx	Tandroy-Mahafaly Malagasy	tdx	3.81\nte	Telugu	tel	230.21\ntg	Tajik	tgk	9.23\ntgc	Tigak	tgc	9.71\nth	Thai	tha	10499.77\nthe	Chitwania Tharu	the	10.06\nthq	Kochila Tharu	thq	10.28\nthr	Rana Tharu	thr	9.99\nthv	Tahaggart Tamahaq	thv	4.25\nti	Tigrinya	tir	0.08\ntig	Tigre	tig	7.49\ntio	Teop	tio	9.85\ntk	Turkmen	tuk	2.86\ntkg	Tesaka Malagasy	tkg	17.86\ntkt	Kathoriya Tharu	tkt	10.64\ntli	Tlingit	tli	0.41\ntlp	Filomena Mata-Coahuitlán Totonac	tlp	11.35\ntn	Tswana	tsn	4.24\ntok	Toki Pona	tok	13.51\ntpl	Tlacoapa Me'phaa	tpl	9.28\ntpz	Tinputz	tpz	9.33\ntqp	Tomoip	tqp	10.1\ntr	Turkish	tur	125.36\ntrp	Kok Borok	trp	10.74\ntrq	San Martín Itunyoso Triqui	trq	8.29\ntrv	Sediq	trv	7.77\ntrw	Torwali	trw	14.98\ntt	Tatar	tat	30.03\nttj	Tooro	ttj	10.31\nttr	Tera	ttr	9.89\nttu	Torau	ttu	9.87\ntui	Tupuri	tui	9.26\ntul	Tula	tul	9.79\ntuq	Tedaga	tuq	10.0\ntuv	Turkana	tuv	10.17\ntuy	Tugen	tuy	8.79\ntvo	Tidore	tvo	10.31\ntvu	Tunen	tvu	9.85\ntw	Twi	twi	0.25\ntwu	Termanu	twu	11.45\ntxs	Tonsea	txs	9.32\ntxy	Tanosy Malagasy	txy	12.07\nudl	Wuzlam	udl	9.23\nug	Uighur	uig	428.77\nuk	Ukrainian	ukr	1851.97\nuki	Kui (India)	uki	10.77\numb	Umbundu	umb	10.59\nur	Urdu	urd	211.27\nush	Ushojo	ush	6.36\nuz	Uzbek	uzb	115.28\nuzn	Northern Uzbek	uzn	15.23\nvai	Vai	vai	8.76\nvar	Huarijio	var	9.28\nver	Mom Jango	ver	10.93\nvi	Vietnamese	vie	8481.98\nvmc	Juxtlahuaca Mixtec	vmc	9.43\nvmj	Ixtayutla Mixtec	vmj	10.17\nvmm	Mitlatongo Mixtec	vmm	9.95\nvmp	Soyaltepec Mazatec	vmp	10.17\nvmz	Mazatlán Mazatec	vmz	9.82\nvot	Votic	vot	0.1\nvro	Võro	vro	15.66\nwbl	Wakhi	wbl	11.67\nwci	Waci Gbe	wci	8.02\nweo	Wemale	weo	9.09\nwes	Cameroon Pidgin	wes	10.06\nwja	Waja	wja	10.22\nwji	Warji	wji	11.39\nwo	Wolof	wol	8.71\nwof	Gambian Wolof	wof	9.46\nxh	Xhosa	xho	13.35\nxhe	Khetrani	xhe	9.4\nxka	Kalkoti	xka	8.0\nxmf	Mingrelian	xmf	11.47\nxmv	Antankarana Malagasy	xmv	17.9\nxmw	Tsimihety Malagasy	xmw	11.53\nxpe	Liberia Kpelle	xpe	9.5\nxti	Sinicahua Mixtec	xti	9.5\nxtu	Cuyamecalco Mixtec	xtu	9.4\nyaq	Yaqui	yaq	9.93\nyav	Yangben	yav	8.7\nyay	Agwagwune	yay	8.26\nydd	Eastern Yiddish	ydd	18.43\nydg	Yidgha	ydg	9.89\nyer	Tarok	yer	10.08\nyes	Nyankpa	yes	10.26\nyi	Yiddish	yid	1.81\nyo	Yoruba	yor	15.66\nyue	Cantonese	yue	13302.38\nzga	Kinga	zga	9.5\nzgh	Standard Moroccan Tamazight	zgh	1.19\nzh	Chinese	cmn	111343.3\nzoc	Copainalá Zoque	zoc	10.07\nzoh	Chimalapa Zoque	zoh	9.35\nzor	Rayón Zoque	zor	9.04\nzpv	Chichicapan Zapotec	zpv	9.85\nzpy	Mazaltepec Zapotec	zpy	9.47\nztg	Xanaguía Zapotec	ztg	9.86\nztn	Santa Catarina Albarradas Zapotec	ztn	10.02\nztp	Loxicha Zapotec	ztp	9.62\nzts	Tilquiapan Zapotec	zts	9.33\nztu	Güilá Zapotec	ztu	9.17\nzu	Zulu	zul	14.83\nzza	Zaza	zza	1.52\n";
const OMNIVOICE_LANGUAGES = languageMapSource.trim().split(/\r?\n/).slice(1).map((line) => {
  const [code, name, iso6393] = line.split("	");
  return { code, name, iso6393 };
}).filter((language) => language.code && language.name);
const OMNIVOICE_LANGUAGE_COUNT = OMNIVOICE_LANGUAGES.length;
function searchOmniVoiceLanguages(query, limit = 60) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const popularCodes = ["vi", "en", "zh", "ja", "ko", "fr", "de", "es", "pt", "ru", "th", "id"];
  if (!normalizedQuery) {
    return popularCodes.map((code) => OMNIVOICE_LANGUAGES.find((language) => language.code === code)).filter((language) => Boolean(language));
  }
  return OMNIVOICE_LANGUAGES.filter((language) => language.code.toLocaleLowerCase().includes(normalizedQuery) || language.iso6393.toLocaleLowerCase().includes(normalizedQuery) || language.name.toLocaleLowerCase().includes(normalizedQuery)).slice(0, limit);
}
export {
  OMNIVOICE_LANGUAGE_COUNT as O,
  OMNIVOICE_LANGUAGES as a,
  searchOmniVoiceLanguages as s,
  useTtsStore as u
};
