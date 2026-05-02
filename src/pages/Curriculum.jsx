// src/pages/Curriculum.jsx
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SEMESTERS, ELECTIVES } from "../data/curriculum";
import { useResources } from "../hooks/useResources";
import { useNavigate } from "react-router-dom";
import s from "./Curriculum.module.css";

const CAT = {
  CSE:  { bg:"#DBEAFE", c:"#2563EB" },
  SCI:  { bg:"#FEF3C7", c:"#D97706" },
  ENGG: { bg:"#D1FAE5", c:"#059669" },
  HUM:  { bg:"#EDE9FE", c:"#7C3AED" },
  PRJ:  { bg:"#FEE2E2", c:"#DC2626" },
};

export default function Curriculum() {
  const { resources }    = useResources();
  const navigate          = useNavigate();
  const [openTrack, setOpenTrack] = useState(null);

  const countByCode = {};
  resources.forEach(r => { countByCode[r.course_code] = (countByCode[r.course_code]||0)+1; });

  const totalCredits = Object.values(SEMESTERS)
    .flat().reduce((a,c) => a+c.credits, 0);

  return (
    <div className={s.page}>
      <div className={s.inner}>
        {/* Page header */}
        <div className={s.pageHeader}>
          <h1 className={s.heading}>📚 B.Tech CSE Curriculum</h1>
          <p className={s.sub}>Amrita School of Engineering · 2023 onwards · {totalCredits} Total Credits</p>
        </div>

        {/* Semester tables */}
        {Object.entries(SEMESTERS).map(([sem, courses]) => {
          const semCr = courses.reduce((a,c) => a+c.credits, 0);
          return (
            <div key={sem} className={s.semCard}>
              <div className={s.semHead}>
                <span className={s.semTitle}>{sem}</span>
                <span className={s.semCr}>{semCr} cr</span>
              </div>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Code</th><th>Subject</th><th>Cat</th><th>Cr</th><th>Resources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c,i) => {
                      const rc = countByCode[c.code] || 0;
                      const cs = CAT[c.cat] || { bg:"#eee", c:"#555" };
                      return (
                        <tr key={c.code} className={i%2?s.rowOdd:""}>
                          <td className={s.tdCode}>{c.code}</td>
                          <td className={s.tdTitle}>{c.title}</td>
                          <td>
                            <span className={s.catBadge} style={{background:cs.bg,color:cs.c}}>{c.cat}</span>
                          </td>
                          <td className={s.tdCr}>{c.credits}</td>
                          <td>
                            <button
                              className={`${s.resBtn} ${rc>0?s.resBtnOn:""}`}
                              onClick={() => navigate("/", { state: { course: c.code } })}
                            >
                              {rc} res.
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Electives */}
        <div className={s.elecSection}>
          <h2 className={s.elecHeading}>Professional Electives</h2>
          <p className={s.elecSub}>Choose from specialisation tracks in Sem V–VII</p>
          <div className={s.elecGrid}>
            {Object.entries(ELECTIVES).map(([track, courses]) => (
              <div key={track} className={s.elecCard}>
                <button
                  className={s.elecBtn}
                  onClick={() => setOpenTrack(openTrack === track ? null : track)}
                >
                  <div>
                    <div className={s.elecTrack}>{track}</div>
                    <div className={s.elecCount}>{courses.length} courses available</div>
                  </div>
                  {openTrack === track ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                </button>
                {openTrack === track && (
                  <ul className={s.elecList}>
                    {courses.map(c => (
                      <li key={c.code} className={s.elecItem}>
                        <span className={s.elecCode}>{c.code}</span>
                        <span>{c.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
