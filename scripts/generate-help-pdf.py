from pathlib import Path
import json,hashlib,os
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
root=Path(__file__).resolve().parents[1]
source=root/'js/data/help.js'
guide=json.loads(source.read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))
regular=Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts/segoeui.ttf'
bold=regular.with_name('segoeuib.ttf')
if regular.exists() and bold.exists():
 pdfmetrics.registerFont(TTFont('Guide',str(regular)));pdfmetrics.registerFont(TTFont('GuideBold',str(bold)))
else:
 pdfmetrics.registerFont(TTFont('Guide','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'));pdfmetrics.registerFont(TTFont('GuideBold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
font='Guide';boldfont='GuideBold';ink=HexColor('#233146');gold=HexColor('#ffcc29')
styles={
 'title':ParagraphStyle('title',fontName=boldfont,fontSize=22,leading=27,textColor=ink,spaceAfter=7),
 'intro':ParagraphStyle('intro',fontName=font,fontSize=10.2,leading=14,textColor=ink,spaceAfter=7),
 'link':ParagraphStyle('link',fontName=font,fontSize=9,leading=13,textColor=HexColor('#315482'),spaceAfter=12),
 'heading':ParagraphStyle('heading',fontName=boldfont,fontSize=11.4,leading=15,textColor=ink,spaceBefore=9,spaceAfter=4),
 'body':ParagraphStyle('body',fontName=font,fontSize=9.5,leading=12.5,textColor=ink,spaceAfter=4,leftIndent=9,firstLineIndent=-9),
 'note':ParagraphStyle('note',fontName=font,fontSize=9.5,leading=12.5,textColor=ink),
 'notehead':ParagraphStyle('notehead',fontName=boldfont,fontSize=10.3,leading=14,textColor=ink,spaceAfter=4),
 'closing':ParagraphStyle('closing',fontName=boldfont,fontSize=9.8,leading=13.5,textColor=ink,spaceBefore=10)
}
output=root/'assets/guias/guia-piloto.pdf';output.parent.mkdir(exist_ok=True,parents=True)
def footer(c,doc):
 w,h=A4;c.setFillColor(gold);c.rect(0,h-7,w,7,fill=1,stroke=0)
 c.setStrokeColor(HexColor('#d8dde3'));c.line(40,34,w-40,34)
 c.setFont(font,8);c.setFillColor(HexColor('#596679'));c.drawString(40,22,'UPTC · GIS | '+guide['version']);c.drawRightString(w-40,22,str(doc.page))
def metadata(c,doc):
 c.setTitle('Guía rápida del piloto de mapeo curricular');c.setAuthor('UPTC · GIS');c.setSubject('help-content-sha256:'+hashlib.sha256(source.read_text(encoding='utf-8-sig').encode('utf-8')).hexdigest());footer(c,doc)
doc=SimpleDocTemplate(str(output),pagesize=A4,rightMargin=40,leftMargin=40,topMargin=28,bottomMargin=47)
story=[Paragraph(escape(guide['title']),styles['title']),Paragraph(escape(guide['intro']),styles['intro']),Paragraph('<link href="'+guide['url']+'">'+guide['url']+'</link>',styles['link'])]
box=Table([[ [Paragraph(escape(guide['localTitle']),styles['notehead']),Paragraph(escape(guide['localText']),styles['note'])] ]],colWidths=[A4[0]-80])
box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),HexColor('#fff5d5')),('BOX',(0,0),(-1,-1),.6,HexColor('#d7b849')),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),10)]));story.extend([box,Spacer(1,3)])
for i,section in enumerate(guide['sections'],1):
 heading=Paragraph(str(i)+'. '+escape(section['title']),styles['heading'])
 paragraphs=[Paragraph('• '+escape(item),styles['body']) for item in section['items']]
 story.append(KeepTogether([heading,paragraphs[0]]));story.extend(paragraphs[1:])
story.append(Paragraph(escape(guide['closing']),styles['closing']))
doc.build(story,onFirstPage=metadata,onLaterPages=footer)
print(output)
