// B01 0.00-1.44 [WIDE] ชายคนนี้ทุบกำแพง  // establish geography (rule 1)
S('B01', 0, 'cut', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B02 1.44-4.08 [MED] คอนกรีตพังได้  // show the action literally (rule 4); walkAlong / sitMove / actPunch
S('B02', 1.44, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B03 4.08-5.42 [CU] เขาชื่อ*วิกเตอร์*  // highlighted word: name label if it is a new character
S('B03', 4.08, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B04 5.42-7.18 [WIDE] ราชาแห่งเขตตะวันออก  // establish geography (rule 1); place label? (เขต)
S('B04', 5.42, 'sweep', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B05 7.18-10.10 [WIDE] เขตที่อันตรายที่สุดในZERO CITY  // establish geography (rule 1); same size as before: change angle / side / height
S('B05', 7.18, 'cut', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B06 10.10-12.46 [CU] คนอ่อนแอที่นั่นต้องจ่ายส่วย  // 
S('B06', 10.1, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B07 12.46-14.56 [MED] แลกกับการมีลมหายใจ  // 
S('B07', 12.46, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B08 14.56-18.46 [WIDE] และผมเดินเข้าไปในฐานของเขาคนเดียว  // establish geography (rule 1); place label? (ฐาน)
S('B08', 14.56, 'push', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B09 18.46-19.84 [MED] ทันทีที่ก้าวเข้าไป  // 
S('B09', 18.46, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B10 19.84-21.82 [CU] คนของวิกเตอร์กว่า*ห้าสิบ*คน  // highlighted word: name label if it is a new character
S('B10', 19.84, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B11 21.82-23.70 [MED] หันมามองผมพร้อมกัน  // show the action literally (rule 4); walkAlong / sitMove / actPunch
S('B11', 21.82, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B12 23.70-24.68 [WIDE] แกมาจากไหน  // 
S('B12', 23.7, 'cut', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B13 24.68-26.76 [MED] ผมมาเสนอผลประโยชน์ให้คุณ  // 
S('B13', 24.68, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B14 26.76-28.74 [CU] เขาหัวเราะลั่นทั้งโกดัง  // push in to CU on the emotional word; sob()/listen() if it fits; place label? (โกดัง)
S('B14', 26.76, 'fgwipe', SET, (lt, t) => { /* CU */ }, { rain: false });
// B15 28.74-31.48 [MED] แล้วหมัดของเขาก็พุ่งผ่านข้างหัวผม  // show the action literally (rule 4); walkAlong / sitMove / actPunch
S('B15', 28.74, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B16 31.48-33.74 [MED] กำแพงด้านหลังแตกเป็นรู  // show the action literally (rule 4); walkAlong / sitMove / actPunch; same size as before: change angle / side / height
S('B16', 31.48, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B17 33.74-35.24 [CU] ผมไม่กะพริบตาเลย  // push in to CU on the emotional word; sob()/listen() if it fits
S('B17', 33.74, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B18 35.24-37.24 [WIDE] เพราะผมไม่ได้มาท้าทายเขา  // 
S('B18', 35.24, 'cut', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B19 37.24-40.38 [MED] ผมมาดูว่าเขาไว้ใจใครมากที่สุด  // 
S('B19', 37.24, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B20 40.38-42.38 [INSERT] ผมวางกระดาษแผ่นหนึ่งลงบนโต๊ะ  // insert the named object (prop to the lens)
S('B20', 40.38, 'cut', SET, (lt, t) => { /* INSERT */ }, { rain: false });
// B21 42.38-44.15 [MED] รายชื่อคนสนิทของวิกเตอร์  // 
S('B21', 42.38, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B22 44.15-47.33 [CU] พร้อมตัวเลขว่าใครแอบเก็บส่วยไว้เท่าไร  // 
S('B22', 44.15, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B23 47.33-51.07 [MED] รู้ไหมว่าทำไมคนที่แข็งแกร่งที่สุดมักถูก*ทรยศ*  // highlighted word: name label if it is a new character
S('B23', 47.33, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B24 51.07-52.83 [WIDE] เพราะคนที่ยืนใกล้คุณที่สุด  // 
S('B24', 51.07, 'cut', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B25 52.83-55.11 [MED] รู้ว่าจุดอ่อนคุณอยู่ตรงไหน  // 
S('B25', 52.83, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B26 55.11-57.85 [CU] รอยยิ้มของวิกเตอร์ค่อย ๆ หายไป  // push in to CU on the emotional word; sob()/listen() if it fits
S('B26', 55.11, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B27 57.85-60.23 [MED] เขาหันไปมองคนรอบตัวทีละคน  // show the action literally (rule 4); walkAlong / sitMove / actPunch
S('B27', 57.85, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B28 60.23-62.55 [WIDE] และคนรอบตัวก็เริ่มมองกันเอง  // 
S('B28', 60.23, 'cut', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B29 62.55-63.51 [MED] แกต้องการอะไร  // 
S('B29', 62.55, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B30 63.51-67.01 [CU] แค่อยากให้คุณมีชีวิตอยู่ต่ออีกสักหน่อย  // 
S('B30', 63.51, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B31 67.01-70.09 [WIDE] ผมเดินออกจากฐานโดยไม่มีใครกล้าขวาง  // establish geography (rule 1)
S('B31', 67.01, 'sweep', SET, (lt, t) => { /* WIDE */ }, { rain: false });
// B32 70.09-72.07 [CU] ทุกอย่างเป็นไปตามแผน  // 
S('B32', 70.09, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B33 72.07-74.05 [MED] อย่างน้อยผมก็คิดแบบนั้น  // 
S('B33', 72.07, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B34 74.05-77.43 [CU] จนชายในเสื้อคลุมดำคนหนึ่งยืนขวางทาง  // 
S('B34', 74.05, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B35 77.43-79.01 [CU] ผมมองไม่เห็นหน้าเขา  // push in to CU on the emotional word; sob()/listen() if it fits; same size as before: change angle / side / height
S('B35', 77.43, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B36 79.01-80.61 [CU] เห็นแค่รอยยิ้มบาง ๆ  // push in to CU on the emotional word; sob()/listen() if it fits; same size as before: change angle / side / height
S('B36', 79.01, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B37 80.61-82.29 [MED] เด็กใหม่ไม่มีพลัง  // 
S('B37', 80.61, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B38 82.29-83.89 [MED] กล้าเดินเข้าไปหาเจ้าถิ่น  // show the action literally (rule 4); walkAlong / sitMove / actPunch; same size as before: change angle / side / height
S('B38', 82.29, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B39 83.89-87.07 [CU] หรือแกกำลังทำให้ทุกคนคิดว่าแกอ่อนแอ  // thought beat: whisperAt
S('B39', 83.89, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B40 87.07-88.25 [MED] ผมหยุดเดิน  // show the action literally (rule 4); walkAlong / sitMove / actPunch
S('B40', 87.07, 'cut', SET, (lt, t) => { /* MED */ }, { rain: false });
// B41 88.25-89.39 [CU] เป็นครั้งแรก  // 
S('B41', 88.25, 'cut', SET, (lt, t) => { /* CU */ }, { rain: false });
// B42 89.39-93.56 [WIDE] ที่มีคนมองออกว่าผมกำลัง*เล่นเกม*  // highlighted word: name label if it is a new character
S('B42', 89.39, 'cut', SET, (lt, t) => { /* WIDE */ }, { rain: false });
