import { motion } from 'framer-motion';

const stagger = { show:{ transition:{ staggerChildren:0.07 } } };
const slideUp = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{duration:0.38,ease:[0.16,1,0.3,1]}} };

export function PageShell({ children }) {
  return (
    <motion.div className="page-wrap" initial="hidden" animate="show" variants={stagger}>
      {children}
    </motion.div>
  );
}

export function FadeItem({ children, className='', delay=0 }) {
  return (
    <motion.div className={className}
      variants={{ hidden:{opacity:0,y:10}, show:{opacity:1,y:0,transition:{duration:0.38,ease:[0.16,1,0.3,1],delay}} }}>
      {children}
    </motion.div>
  );
}

export function PageHero({ eyebrow, title, description, actions, aside }) {
  return (
    <FadeItem>
      <div style={{ paddingBottom:28, borderBottom:'1px solid var(--border-0)', marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16, flexWrap:'wrap' }}>
          <div style={{ maxWidth:640 }}>
            {eyebrow && <div className="eyebrow" style={{ marginBottom:12 }}><span className="e-dot"/>{eyebrow}</div>}
            <h1 className="page-title">{title}</h1>
            {description && <p className="page-desc">{description}</p>}
            {actions && <div className="row" style={{ marginTop:18 }}>{actions}</div>}
          </div>
          {aside && <div style={{ flexShrink:0 }}>{aside}</div>}
        </div>
      </div>
    </FadeItem>
  );
}

export function Card({ children, className='', style={}, accent }) {
  const ac = accent==='cyan'?' card-cyan':accent==='coral'?' card-coral':accent==='teal'?' card-teal':'';
  return (
    <motion.div className={`card${ac} ${className}`} style={style}
      variants={slideUp} initial="hidden" whileInView="show" viewport={{once:true,margin:'-30px'}}>
      {children}
    </motion.div>
  );
}

export function StatusBadge({ children, tone='muted' }) {
  const m = { cyan:'b-cyan', teal:'b-teal', coral:'b-coral', violet:'b-violet', muted:'b-muted', warning:'b-warning' };
  return <span className={`badge ${m[tone]||'b-muted'}`}>{children}</span>;
}

export function PrimaryButton({ children, className='', loading=false, ...p }) {
  return (
    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
      {...p} className={`btn btn-primary ${className}`} disabled={p.disabled||loading}>
      {loading && <span className="spinner spinner-sm" style={{borderColor:'rgba(10,15,30,0.2)',borderTopColor:'var(--ink)'}}/>}
      {children}
    </motion.button>
  );
}

export function SecondaryButton({ children, className='', ...p }) {
  return (
    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
      {...p} className={`btn btn-secondary ${className}`}>{children}</motion.button>
  );
}

export function DangerButton({ children, className='', ...p }) {
  return (
    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
      {...p} className={`btn btn-danger ${className}`}>{children}</motion.button>
  );
}

export function SectionHeader({ title, badge, action }) {
  return (
    <div className="sec-hd">
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <span className="sec-title">{title}</span>{badge}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon='📭', title, desc, action }) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon}</div>
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
      {action}
    </div>
  );
}

export function ConfirmModal({ title, desc, onConfirm, onCancel, danger=false }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <p className="sec-title" style={{marginBottom:8}}>{title}</p>
        {desc && <p style={{fontSize:14,color:'rgba(255,255,255,0.48)',lineHeight:1.65,marginBottom:22}}>{desc}</p>}
        <div className="row">
          <button className={`btn ${danger?'btn-danger':'btn-primary'}`} onClick={onConfirm}>Confirm</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
