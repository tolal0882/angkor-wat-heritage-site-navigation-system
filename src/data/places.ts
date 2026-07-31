/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Place } from '../types';

// Canonical dataset (Dataset/Data_Collection_PBL.xlsx) - 14 Angkor heritage sites,
// mirroring Smart_Tour_Planning_System.py
export const PLACES: Place[] = [
  {
    id: 'angkor_wat',
    templeId: 'T01',
    name: 'Angkor Wat',
    type: 'Main Temple',
    openingHours: '5:00 AM - 5:30 PM',
    description:
      "Built by King Suryavarman II in the early 12th century (1113-1150). Originally dedicated to Hinduism (Vishnu) and later became a Buddhist temple. Cambodia's largest and most famous temple.",
    x: 356,
    y: 660,
  },
  {
    id: 'phnom_bakheng',
    templeId: 'T02',
    name: 'Phnom Bakheng',
    type: 'Mountain Temple',
    openingHours: '5:00 AM - 5:30 PM',
    description:
      'Built by King Yasovarman I in the late 9th century (889-910). A Hindu temple dedicated to Shiva and famous for its panoramic sunrise and sunset views.',
    x: 158,
    y: 565,
  },
  {
    id: 'bayon',
    templeId: 'T03',
    name: 'Bayon',
    type: 'Main Temple',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Jayavarman VII in the late 12th century. A Mahayana Buddhist temple famous for its smiling stone faces.',
    x: 224,
    y: 465,
  },
  {
    id: 'baphuon',
    templeId: 'T04',
    name: 'Baphuon',
    type: 'Mountain Temple',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Udayadityavarman II in the 11th century. Originally a Hindu temple dedicated to Shiva and later converted into a Buddhist temple.',
    x: 60,
    y: 227,
  },
  {
    id: 'terrace_of_the_elephants',
    templeId: 'T05',
    name: 'Terrace of the Elephants',
    type: 'Historical Monument',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built during the reign of King Jayavarman VII in the late 12th century. A royal ceremonial terrace decorated with elephant carvings.',
    x: 224,
    y: 227,
  },
  {
    id: 'terrace_of_the_leper_king',
    templeId: 'T06',
    name: 'Terrace of the Leper King',
    type: 'Historical Monument',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built during the reign of King Jayavarman VII in the late 12th century. Famous for its intricate carvings of gods and mythical figures.',
    x: 224,
    y: 153,
  },
  {
    id: 'tep_pranam',
    templeId: 'T07',
    name: 'Tep Pranam',
    type: 'Historical Monument',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built during the late 12th to early 13th century, mainly under King Jayavarman VII. A Buddhist sanctuary featuring a large seated Buddha and located within Angkor Thom, near the Royal Palace and Terrace of the Leper King.',
    x: 219,
    y: 66,
  },
  {
    id: 'preah_pithu_u',
    templeId: 'T08',
    name: 'Preah Pithu U',
    type: 'Historical Monument',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Jayavarman VII in 1191. A Mahayana Buddhist temple dedicated to his father and served as a monastery, university, and royal city.',
    x: 405,
    y: 66,
  },
  {
    id: 'ta_tuot',
    templeId: 'T09',
    name: 'Ta Tuot',
    type: 'Historical Monument',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'A small Angkor shrine dating from the late Angkor period. It was used as a local place of worship within the Angkor Thom area.',
    x: 562,
    y: 60,
  },
  {
    id: 'ta_keo',
    templeId: 'T10',
    name: 'Ta Keo',
    type: 'Mountain Temple',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Jayavarman V in the late 10th century. A Hindu temple dedicated to Shiva and one of the first Khmer temples built entirely from sandstone.',
    x: 710,
    y: 242,
  },
  {
    id: 'ta_prohm',
    templeId: 'T11',
    name: 'Ta Prohm',
    type: 'Monastery Temple',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Jayavarman VII in 1186. A Mahayana Buddhist monastery famous for the giant tree roots growing over the temple ruins.',
    x: 717,
    y: 465,
  },
  {
    id: 'banteay_kdei',
    templeId: 'T12',
    name: 'Banteay Kdei',
    type: 'Monastery Temple',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Jayavarman VII in the late 12th century. A Mahayana Buddhist monastery with architecture similar to Ta Prohm.',
    x: 940,
    y: 553,
  },
  {
    id: 'kravan',
    templeId: 'T13',
    name: 'Kravan',
    type: 'Hindu Temple',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Harshavarman I in 921 AD. A Hindu temple dedicated to Vishnu and renowned for its unique brick bas-reliefs.',
    x: 612,
    y: 660,
  },
  {
    id: 'thommanon',
    templeId: 'T14',
    name: 'Thommanon',
    type: 'Hindu Temple',
    openingHours: '7:30 AM - 5:30 PM',
    description:
      'Built by King Suryavarman II in the early 12th century. A Hindu temple dedicated to Shiva and Vishnu, famous for its finely carved devatas.',
    x: 503,
    y: 235,
  },
];
