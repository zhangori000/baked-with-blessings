import type { Payload, PayloadRequest } from 'payload'

import { createParagraphsRichText, createSegmentedParagraphsRichText } from './richText'

const firstPostParagraphs = [
  'It is a common path of life, where we work hard in school, enroll in college, get a degree, and then get a job. If someone does not want to go to school, our society usually labels them as some form of outcast. The burden of proof falls onto that person, in the same way that our criminal legal system, by default, assumes that the charged person is innocent until proven guilty. Except here, the situation is reversed. People who do not want to get a degree are guilty until proven innocent.',
  'But what even is college? In its purest technical form, getting a degree is simply doing these things. You follow some form of administrative sheet that says, "In order for you to be declared a computer science major, you must take these required courses, and these optional courses, and other combinations."',
  "And what does one course entail? It involves a professor, who is supposed to be a great teacher (highly disputable for a vast majority of schools in America), and the professor has TAs who are supposed to help you. The professor has a lesson plan, where you attend their lectures 1-5 times a week, and after several weeks, you get evaluated based on an exam, and that exam will determine your grade. And keep in mind, for majors like engineering, you're probably spending 10 hours a day just reading slides, doing problems, in order to pass a bi-weekly quiz, or a midterm, or a final. Sometimes you have group projects, sometimes you have labs.",
  "Here is another complexity. We can clearly discover the professor's credentials easily. The professor could've gone to an amazing school, had amazing grades, and amazing research. We can even see, through other sites and public opinion, whether the professor is a good teacher (in the eyes of public forums). What we cannot see, however, is why the professor got hired. The professor also had to click \"Apply,\" and I'm sure the school received hundreds upon hundreds of applications for that position. The professor probably had to go through interviews, and then the admissions committee had to have some reason for hiring that professor.",
  'And another complexity is firing that professor. The professor probably has 10 duties aside from teaching. What are the criteria for letting a professor go? What are the criteria for giving a professor feedback? What are the checks and balances such that we can satisfy the students, but also not firing professors for a lack of substantial reasons?',
  "So on face value, college seems to be amazing. You're forced to take classes of various diversities, which should all be related to your major, which in turn should help you get a job in the future. You're forced to sit down for 10 hours, studying concepts, learning, and ultimately learning great skills, not just on the subject matter, but also time management, communication, and more.",
  "But it is also clearly known by society that there is a lot of nuance to this. What happens if the professor is truly really bad at teaching? What happens if the courses you're forced to take for the major are not that related to the future career? What happens if there is no internal career coaching such that you can have industry professionals tutor you and guide you into what classes you should take, and what midterms/concepts are actually going to be useful or not useful? What happens if you, as the student, lack the prerequisite skills to succeed under this system?",
  'All of this is a risk. Because ultimately, to get a job, you go to a networking event, or you go to a company website, you find the career openings, and you find a job description that matches your credentials, and then you click "Apply," send your resume and other materials, and then some admissions committee will read your resume and decide whether to give you an interview opportunity. And after you pass the various rounds of interview, competing against other students, then you will get a job. The end game of all this also entails a lot of risk. By signing up for this college path, you are taking on the risk of being better than others, the risk of the market going bankrupt, and probably more.',
  'What I am arguing is not that school is trash. In fact, I have not made a single definitive claim yet. You can just interpret my words as mere rambling, I am simply collecting information; I am not sure what I am going to do with it yet; these are just observations about life.',
  'School definitely incurs tons of risk for certain individuals, and we, as a society, are not doing enough to spread awareness of this reality. There are tons of people who would excel in school, and excel in this system of, do classes, listen to the professor, know how to do well on exams, know how to apply, know how to pass interviews, and boom, we are done. But there are also tons of people who are not ready for this path. But what are the alternatives? Is it just choosing the worst of two evils then?',
  "Everything in life is a business. Who owns the toilet paper industry? Who creates the stop sign metal? Who paints the houses, and who designs sidewalks and fixes potholes? Who creates straws and cups? Who is the expert manufacturer of chips bags? Who decided one day to create Icelandic Airlines? I mean, I don't know. And I'm sure most people wouldn't know. And I'm sure most people think that it is impossible to create a good business now, and that succeeding in business is as rare as going to the NBA.",
  'I think the correct cost benefit analysis for students to do is to ask themselves, "Would I rather dedicate myself to midterms, quizzes, presentations, long hours of studying ____? Or would I rather dedicate myself to the equivalent amount of long hours on making a new business, such as becoming the expert at shoveling snow, or becoming the expert at making houses beautiful, or becoming the expert at training others how to exercise, etc."',
  'Another thing to consider is that this world, sadly, is becoming more credentials based. People do not look at a major and think about professors and midterms and quizzes. So the biggest risk of not getting a degree is that you will be ignored. Sometimes, it is also important to come to terms with the status quo of the world, unless you want to be a force of extreme change.',
  'And most of the time, you can pursue both a major and have the spirit to start a business. And moreover, a business does not need to be huge at all, it could just be a local enterprise where your goal is to simply help the needs of the community.',
  'I have chosen to pursue a major AND also to pursue creating a bakery/cafe. I have historically been pretty good at school, and I think I can apply the things I learn in school to this business. I am completely new, and I am still excited to learn more. I hope the future will be bright with opportunities. I hope to open more transparent discussion about the issues of our world and to also help others along the way.',
]

const firstPostData = {
  _status: 'published' as const,
  authorName: 'Oscar Kingsley',
  content: createParagraphsRichText(firstPostParagraphs),
  excerpt:
    'A personal reflection on college, credentials, risk, and choosing to build a bakery/cafe while pursuing a degree.',
  meta: {
    description:
      'Orianna Paxton reflects on college, credentials, risk, and starting a bakery/cafe in 2026.',
    title: 'Ramblings about college and starting a business in 2026',
  },
  publishedOn: '2026-04-27T12:00:00.000Z',
  slug: 'ramblings-about-college-and-starting-a-business-in-2026',
  title: 'Ramblings about college and starting a business in 2026.',
}

const ishiguroReviewContent = createSegmentedParagraphsRichText([
  [
    'I have read four books by Kazuo Ishiguro: ',
    { italic: true, text: 'Klara and the Sun' },
    ', ',
    { italic: true, text: 'The Remains of the Day' },
    ', ',
    { italic: true, text: 'Never Let Me Go' },
    ', and ',
    { italic: true, text: 'The Buried Giant' },
    '. Each of these novels has a clear plot, but each one also contains some kind of central mystery that the reader must slowly unravel. In ',
    { italic: true, text: 'Klara and the Sun' },
    ", the mystery involves a futuristic society where artificial beings serve as companions to humans. In ",
    { italic: true, text: 'The Remains of the Day' },
    ", the mystery centers on Stevens, a reserved butler who gradually reveals both the truth about his former employer and the emotions he has spent his life suppressing. In ",
    { italic: true, text: 'Never Let Me Go' },
    ", the main characters appear to have grown up in a strange dystopian society, and over time the reader discovers the awful truth behind their childhood. In ",
    { italic: true, text: 'The Buried Giant' },
    ', the story takes place in a medieval, almost mythical world where a strange mist has caused people to lose their memories.',
  ],
  [
    'These plots seem as different as they can be. How can there be a unifying theme to each of these? Something I realized about Ishiguro’s books is that they all deal with memories. Ishiguro seems to suggest that memory is one of the main ways people give meaning to their lives. In fact, some of the books are almost ',
    { italic: true, text: 'predominantly' },
    ' flashbacks.',
  ],
  [
    "And a lot of the time, the flashbacks are to positive experiences. I wouldn’t say positive in the sense that it would be a life that you and I would want, but to the characters themselves, it either is truly a flashback to a positive memory or at least a memory where life was more innocent and naive.",
  ],
  [
    "Now the reason why this theme of memory is important is because most of the characters never utter phrases even close to, “I am so depressed; I am so sad; woe is me!” However, by the way the author writes such characters, it is so clear that they are depressed. And I think the way Ishiguro depicts the characters reflecting on their lives signal that. Some of them may not even know that they are depressed, but by their actions it is abundantly clear. As you read his books, you realize that many of Ishiguro's characters did not grow up in a society where they had the resources to become extremely emotionally aware of themselves. So this may tempt the reader, who observes these characters from a third person perspective, to jump in and speak to these characters.",
  ],
  [
    "Moreover, some of them are in their current situation beyond their control, but they must thug it out in life, in hope of a better life—pause. Actually, let me backtrack. Not everyone is hoping for a better life. I realized I can’t even make that assumption. Maybe they’re simply trying to live. Worse, maybe they’re not even trying. Maybe they’re living without even thinking of the future, but only in the present. Or maybe, worse, they’re not even thinking of the present! They’re so preoccupied with the past, that they don’t even seem like they care about the present. Their present is simply a past that they will see in the future. And maybe this is subconscious because maybe some people don’t ",
    { italic: true, text: 'want' },
    ' to focus on the present.',
  ],
  [
    "And what’s crazy is I think many humans actually live this way. For whatever reason, they are somehow stuck in a situation in life that they are not satisfied in at all. But they also have had fond memories of the past, or least an easier past. I think fundamentally, we all yearn for the past, because youth represents opportunity. As you grow older, you feel more restrained, your freedom and optimism naturally shrinks.",
  ],
  [
    "I think in his books, the characters usually reach their breaking point by the end of the book and they break down.",
  ],
  [
    "Because of Ishiguro, I now have a fear of becoming like one of his characters. Right now, in my young life, everything seems pretty fun. In addition, I didn’t have to go through any dystopian trauma as a child either, and I grew up in a situation that gave me a lot of opportunities to not end up in a dump-like situation. Plus, even when things don’t go well, at last you have the hope of time and that youthful energy. But sometimes, I wonder, what if I get myself into a rut that stays with me until the future? Will I always be reminiscing about the past? That would be a great torture for my soul.",
  ],
  [
    'I also wonder, what about Kazuo Ishiguro himself? Is he trying to say something about himself through these books?',
  ],
])

const ishiguroReviewPostData = {
  _status: 'published' as const,
  authorName: 'Oscar Kingsley',
  content: ishiguroReviewContent,
  excerpt:
    'A reflective read-through of four Kazuo Ishiguro novels and how they use memory to explore emotional restraint, longing, and quiet despair.',
  meta: {
    description:
      'A close reading of Kazuo Ishiguro’s novels and their shared theme of memory, regret, and emotional denial.',
    title: 'Author Review: Kazuo Ishiguro — a very subtle but strong depression...',
  },
  publishedOn: '2026-04-28T12:00:00.000Z',
  slug: 'author-book-review-kazuo-ishiguro',
  title: 'Author Review: Kazuo Ishiguro — a very subtle but strong depression...',
}

const seedPosts = [firstPostData, ishiguroReviewPostData]

export const seedBlogPosts = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  for (const postData of seedPosts) {
    const existing = await payload.find({
      collection: 'posts',
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req,
      where: {
        slug: {
          equals: postData.slug,
        },
      },
    })

    const existingPost = existing.docs[0]

    if (existingPost) {
      await payload.update({
        collection: 'posts',
        context: {
          disableRevalidate: true,
        },
        data: postData,
        id: existingPost.id,
        overrideAccess: false,
        req,
      })

      continue
    }

    await payload.create({
      collection: 'posts',
      context: {
        disableRevalidate: true,
      },
      data: postData,
      overrideAccess: false,
      req,
    })
  }
}
